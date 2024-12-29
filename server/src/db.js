const {db} = require('./firebase.js')


const addUserToDatabase = async (user) => {
    try {
        const document = {
            email: user.email,
            displayName: user.displayName
        };
        await db.collection("users").doc(user.uid).set(document);
        console.log("user added to db")
    } catch (error) {
        console.error("Error adding user to db ", error)
    }
}

const getFriendsFromUID = async (uid) => {
    const friendsRef = db.collection("friends");
    const usersRef = db.collection("users");

    const getUser1 = await friendsRef.where("user1", "==", uid).get();
    const getUser2 = await friendsRef.where("user2", "==", uid).get();

    const friends = [];
    getUser1.forEach((doc) => friends.push(doc.data()));
    getUser2.forEach((doc) => friends.push(doc.data()));

    const results = await Promise.all(
        friends.map(async (friendsObj) => {
            const friendUid = friendsObj.user1 === uid ? friendsObj.user2 : friendsObj.user1;
            const status = friendsObj.status;

            const friendDoc = await usersRef.doc(friendUid).get();
            const friendData = friendDoc.data();

            return {
                name: friendData.displayName,
                uid: friendUid,
                status: status,
            };
        })
    );
    
    return results;
};

module.exports = {
    addUserToDatabase: addUserToDatabase,
    getFriendsFromUID: getFriendsFromUID
};
