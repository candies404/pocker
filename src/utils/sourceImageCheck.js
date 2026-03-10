import fetch from 'node-fetch';
import {SocksProxyAgent} from 'socks-proxy-agent';
import {validateImageAddress} from '@/utils/validation';

const MANIFEST_ACCEPT_HEADER = [
    'application/vnd.oci.image.manifest.v1+json',
    'application/vnd.docker.distribution.manifest.v2+json',
    'application/vnd.oci.image.index.v1+json',
    'application/vnd.docker.distribution.manifest.list.v2+json'
].join(', ');

export const SOURCE_REGISTRY_OPTIONS = {
    dockerHub: {
        value: 'dockerHub',
        label: 'Docker Hub',
        registry: 'docker.io'
    },
    ghcr: {
        value: 'ghcr',
        label: 'GHCR',
        registry: 'ghcr.io'
    }
};

const DOCKER_HUB_REGISTRIES = new Set(['docker.io', 'index.docker.io', 'registry-1.docker.io']);

const getRequestOptions = (options = {}) => {
    const isLocal = process.env.NODE_ENV === 'development';
    const proxyUrl = isLocal ? 'socks5://127.0.0.1:7890' : '';
    const agent = proxyUrl ? new SocksProxyAgent(proxyUrl) : null;

    return {
        ...options,
        ...(agent && {agent})
    };
};

const normalizeRegistryName = (registry = 'docker.io') => {
    const normalizedRegistry = registry.toLowerCase();
    if (DOCKER_HUB_REGISTRIES.has(normalizedRegistry)) {
        return 'docker.io';
    }
    return normalizedRegistry;
};

const normalizeSourceRegistry = (sourceRegistry = 'dockerHub') => {
    const matchedRegistry = SOURCE_REGISTRY_OPTIONS[sourceRegistry];
    return matchedRegistry ? matchedRegistry.registry : normalizeRegistryName(sourceRegistry);
};

const normalizeRepository = (registry, repository) => {
    if (registry === 'docker.io' && !repository.includes('/')) {
        return `library/${repository}`;
    }
    return repository;
};

const buildParsedImage = (image, sourceRegistry) => {
    const validation = validateImageAddress(image);
    if (!validation.isValid) {
        return {
            success: false,
            verdict: 'deny',
            exists: false,
            reason: 'INVALID_IMAGE',
            message: validation.error
        };
    }

    const selectedRegistry = normalizeSourceRegistry(sourceRegistry);
    const parsedRegistry = normalizeRegistryName(validation.parsed.registry);

    if (!['docker.io', 'ghcr.io'].includes(selectedRegistry)) {
        return {
            success: false,
            verdict: 'deny',
            exists: false,
            reason: 'UNSUPPORTED_REGISTRY',
            message: '当前仅支持 Docker Hub 和 GHCR 作为源仓库'
        };
    }

    if (parsedRegistry !== selectedRegistry) {
        const selectedLabel = SOURCE_REGISTRY_OPTIONS[sourceRegistry]?.label || selectedRegistry;
        return {
            success: false,
            verdict: 'deny',
            exists: false,
            reason: 'SOURCE_REGISTRY_MISMATCH',
            message: `当前选择的是 ${selectedLabel}，请填写匹配的镜像地址`
        };
    }

    const repository = normalizeRepository(parsedRegistry, validation.parsed.repository);
    const normalizedImage = validation.parsed.digest
        ? `${parsedRegistry}/${repository}@${validation.parsed.digest}`
        : `${parsedRegistry}/${repository}:${validation.parsed.tag}`;

    return {
        success: true,
        parsedImage: {
            rawImage: image,
            registry: parsedRegistry,
            repository,
            reference: validation.parsed.digest || validation.parsed.tag,
            tag: validation.parsed.tag,
            digest: validation.parsed.digest,
            normalizedImage,
            isOfficial: parsedRegistry === 'docker.io' && repository.startsWith('library/')
        }
    };
};

const buildResult = (parsedImage, overrides = {}) => {
    if (!parsedImage) {
        return {
            success: false,
            verdict: 'deny',
            exists: false,
            ...overrides
        };
    }

    return {
        success: overrides.verdict === 'allow',
        image: parsedImage.rawImage,
        normalizedImage: parsedImage.normalizedImage,
        registry: parsedImage.registry,
        repository: parsedImage.repository,
        reference: parsedImage.reference,
        isOfficial: parsedImage.isOfficial,
        exists: false,
        ...overrides
    };
};

const parseBearerChallenge = (headerValue) => {
    if (!headerValue || !/^Bearer\s+/i.test(headerValue)) {
        return null;
    }

    const params = {};
    const challengeContent = headerValue.replace(/^Bearer\s+/i, '');
    const pattern = /([a-zA-Z_][a-zA-Z0-9_-]*)="([^"]*)"/g;
    let match;

    while ((match = pattern.exec(challengeContent)) !== null) {
        params[match[1].toLowerCase()] = match[2];
    }

    return params.realm ? params : null;
};

const getBearerToken = async (challenge) => {
    const tokenUrl = new URL(challenge.realm);
    if (challenge.service) {
        tokenUrl.searchParams.set('service', challenge.service);
    }
    if (challenge.scope) {
        tokenUrl.searchParams.set('scope', challenge.scope);
    }

    const response = await fetch(tokenUrl.toString(), getRequestOptions({
        method: 'GET'
    }));

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return data.token || data.access_token || null;
};

const requestManifest = async (baseUrl, parsedImage, token) => {
    const headers = {
        Accept: MANIFEST_ACCEPT_HEADER
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const manifestUrl = `${baseUrl}/v2/${parsedImage.repository}/manifests/${parsedImage.reference}`;

    let response = await fetch(manifestUrl, getRequestOptions({
        method: 'HEAD',
        headers
    }));

    if (response.status === 405 || response.status === 406) {
        response = await fetch(manifestUrl, getRequestOptions({
            method: 'GET',
            headers
        }));
    }

    return response;
};

const checkRegistryManifest = async (baseUrl, parsedImage, source) => {
    try {
        const firstResponse = await requestManifest(baseUrl, parsedImage);

        if (firstResponse.status === 200) {
            return buildResult(parsedImage, {
                success: true,
                exists: true,
                verdict: 'allow',
                reason: null,
                source,
                canAnonymousPull: true
            });
        }

        if (firstResponse.status === 404) {
            return buildResult(parsedImage, {
                reason: 'TAG_NOT_FOUND',
                source,
                canAnonymousPull: false
            });
        }

        if (firstResponse.status === 401) {
            const challenge = parseBearerChallenge(firstResponse.headers.get('www-authenticate'));
            if (!challenge) {
                return buildResult(parsedImage, {
                    reason: 'AUTH_REQUIRED',
                    source,
                    canAnonymousPull: false
                });
            }

            const token = await getBearerToken(challenge);
            if (!token) {
                return buildResult(parsedImage, {
                    reason: 'AUTH_REQUIRED',
                    source,
                    canAnonymousPull: false
                });
            }

            const retryResponse = await requestManifest(baseUrl, parsedImage, token);

            if (retryResponse.status === 200) {
                return buildResult(parsedImage, {
                    success: true,
                    exists: true,
                    verdict: 'allow',
                    reason: null,
                    source,
                    canAnonymousPull: true
                });
            }

            if (retryResponse.status === 404) {
                return buildResult(parsedImage, {
                    reason: 'TAG_NOT_FOUND',
                    source,
                    canAnonymousPull: false
                });
            }

            if (retryResponse.status === 401 || retryResponse.status === 403) {
                return buildResult(parsedImage, {
                    reason: 'AUTH_REQUIRED',
                    source,
                    canAnonymousPull: false
                });
            }

            return buildResult(parsedImage, {
                reason: `CHECK_UNAVAILABLE:${retryResponse.status}`,
                source,
                canAnonymousPull: false
            });
        }

        if (firstResponse.status === 403) {
            return buildResult(parsedImage, {
                reason: 'AUTH_REQUIRED',
                source,
                canAnonymousPull: false
            });
        }

        return buildResult(parsedImage, {
            reason: `CHECK_UNAVAILABLE:${firstResponse.status}`,
            source,
            canAnonymousPull: false
        });
    } catch (error) {
        return buildResult(parsedImage, {
            reason: `CHECK_UNAVAILABLE:${error.message}`,
            source,
            canAnonymousPull: false
        });
    }
};

const checkDockerHubImage = async (parsedImage) => {
    const [namespace, ...repositoryParts] = parsedImage.repository.split('/');
    const repository = repositoryParts.join('/');
    const apiUrl = `https://hub.docker.com/v2/namespaces/${namespace}/repositories/${repository}/tags/${parsedImage.tag}`;

    try {
        const response = await fetch(apiUrl, getRequestOptions({
            method: 'HEAD'
        }));

        if (response.status === 200) {
            return buildResult(parsedImage, {
                success: true,
                exists: true,
                verdict: 'allow',
                reason: null,
                source: 'dockerhub-api'
            });
        }

        if (response.status === 404) {
            return buildResult(parsedImage, {
                reason: 'TAG_NOT_FOUND',
                source: 'dockerhub-api'
            });
        }
    } catch (error) {
        return checkRegistryManifest('https://registry-1.docker.io', parsedImage, 'docker-registry-manifest');
    }

    return checkRegistryManifest('https://registry-1.docker.io', parsedImage, 'docker-registry-manifest');
};

export const verifySourceImage = async ({image, sourceRegistry}) => {
    const parsedResult = buildParsedImage(image, sourceRegistry);
    if (!parsedResult.success) {
        return parsedResult;
    }

    if (parsedResult.parsedImage.registry === 'docker.io') {
        return checkDockerHubImage(parsedResult.parsedImage);
    }

    if (parsedResult.parsedImage.registry === 'ghcr.io') {
        return checkRegistryManifest('https://ghcr.io', parsedResult.parsedImage, 'ghcr-manifest');
    }

    return {
        success: false,
        verdict: 'deny',
        exists: false,
        reason: 'UNSUPPORTED_REGISTRY',
        message: '当前仅支持 Docker Hub 和 GHCR 作为源仓库'
    };
};