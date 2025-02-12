export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {key} = req.body;
    const validKey = process.env.ACCESS_KEY;

    if (key === validKey) {
        res.status(200).json({success: true});
    } else {
        res.status(200).json({success: false});
    }
} 