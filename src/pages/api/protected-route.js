import {withAuth} from '@/utils/withAuth';

const handler = (req, res) => {
    // 你的API逻辑
    res.status(200).json({data: 'protected data'});
};

export default withAuth(handler); 