import {withAuth} from '@/utils/withAuth';
import {verifySourceImage} from '@/utils/sourceImageCheck';

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {image, sourceRegistry} = req.body;

    if (!image || !sourceRegistry) {
        return res.status(400).json({
            success: false,
            message: '源仓库类型和镜像地址不能为空'
        });
    }

    try {
        const result = await verifySourceImage({
            image,
            sourceRegistry
        });

        return res.status(200).json({
            success: result.verdict === 'allow',
            data: result,
            message: result.message || null
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || '源镜像校验失败'
        });
    }
};

export default withAuth(handler);