import {updateWorkflowFile} from '@/utils/github';
import {withAuth} from '@/utils/withAuth';
import {verifySourceImage} from '@/utils/sourceImageCheck';
import {validateImageAddress} from '@/utils/validation';

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {sourceImage, sourceRegistry, targetImage} = req.body;

    if (!sourceImage || !sourceRegistry || !targetImage) {
        return res.status(400).json({
            success: false,
            message: '源仓库类型、源镜像、目标镜像不能为空'
        });
    }

    const region = req.headers['x-region'] || 'cn-north-4';
    const targetValidation = validateImageAddress(targetImage);

    if (!targetValidation.isValid) {
        return res.status(400).json({
            success: false,
            message: targetValidation.error
        });
    }

    const expectedTargetRegistry = `swr.${region}.myhuaweicloud.com`;
    if (targetValidation.parsed.registry !== expectedTargetRegistry) {
        return res.status(400).json({
            success: false,
            message: '目标镜像地址与当前区域不匹配'
        });
    }

    try {
        const sourceCheckResult = await verifySourceImage({
            image: sourceImage,
            sourceRegistry
        });

        if (sourceCheckResult.verdict !== 'allow') {
            return res.status(400).json({
                success: false,
                message: sourceCheckResult.message || '源镜像校验失败，已阻止写入 workflow',
                data: sourceCheckResult
            });
        }

        const result = await updateWorkflowFile(sourceCheckResult.normalizedImage, targetImage.trim(), region);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export default withAuth(handler);