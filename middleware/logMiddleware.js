import admin from 'firebase-admin';

const _formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const _formatTime = (date) => {
    const options = {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
};

export const logAdminActivity = async (req, res, next) => {
    try {
        const action = req.action || '';
        const partDescription = req.partDescription || '';
        const { uid, userName } = req.body;

        console.log('Logging action:', uid, userName, action, partDescription);

        let userNameLog = '';
        if (uid) {
            const userDoc = await admin.firestore().collection('users').doc(uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                userNameLog = userData.name || userName || '';
            } else {
                userNameLog = userName || '';
            }
        } else {
            userNameLog = userName || '';
        }

        const timestamp = new Date();
        const formattedDate = _formatDate(timestamp);
        const formattedTime = _formatTime(timestamp);
        const logId = `${uid || 'unknown'}_${formattedDate}_${formattedTime}`;

        let actionDescription;
        switch (action) {
            case 'created':
                actionDescription = 'membuat';
                break;
            case 'updated':
                actionDescription = 'mengupdate';
                break;
            case 'deleted':
                actionDescription = 'menghapus';
                break;
            case 'accepted':
                actionDescription = 'menerima';
                break;
            case 'rejected':
                actionDescription = 'menolak';
                break;
            default:
                actionDescription = 'Melakukan aksi';
        }

        const logEntry = {
            id: logId,
            date: formattedDate,
            time: formattedTime,
            uid: uid || 'unknown',
            description: `Admin ${actionDescription} ${partDescription} ${userNameLog} pada ${formattedDate} ${formattedTime} WIB`,
        };

        await admin.firestore().collection('log_admin').doc(logId).set(logEntry);
        next();
    } catch (error) {
        console.error('Error logging admin activity:', error);
        next();
    }
};
