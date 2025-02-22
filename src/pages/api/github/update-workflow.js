import {updateWorkflowFile} from '@/utils/github';
import {withAuth} from '@/utils/withAuth';
import {tcrClient} from "@/utils/tcr";

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {sourceImage, targetImage} = req.body;

    if (!sourceImage || !targetImage) {
        return res.status(400).json({
            success: false,
            message: '源镜像和目标镜像不能为空'
        });
    }

    try {
        const tenCentUserName = await getTenCentUsername();
        const result = await updateWorkflowFile(sourceImage, targetImage, tenCentUserName);
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

const getTenCentUsername = async () => {
    try {
        const result = await tcrClient.DescribeUserQuotaPersonal();
        return result.Data.LimitInfo[0].Username;
    } catch (error) {
        throw error;
    }
};

export default withAuth(handler); 