const { Timestamp, Filter } = require("firebase-admin/firestore");
const { db } = require("./firebase.js");
const { createBoard } = require('./chess/chess.js');

const addUserToDatabase = async (user) => {
  try {
    const document = {
      email: user.email,
      displayName: user.displayName,
    };
    await db.collection("users").doc(user.uid).set(document);
    console.log("user added to db");
  } catch (error) {
    console.error("Error adding user to db ", error);
  }
};

const getFriendsFromUID = async (uid) => {
  const friendsRef = db.collection("friends");
  const usersRef = db.collection("users");

  const getUser1 = await friendsRef.where("user1", "==", uid).get();
  const getUser2 = await friendsRef.where("user2", "==", uid).get();

  const friends = [];
  getUser1.forEach((doc) => friends.push(doc));
  getUser2.forEach((doc) => friends.push(doc));

  const results = await Promise.all(
    friends.map(async (friendDocument) => {
      const friendsObj = friendDocument.data()
      const friendUid =
        friendsObj.user1 === uid ? friendsObj.user2 : friendsObj.user1;
      const status = friendsObj.status;

      const friendUserDoc = await usersRef.doc(friendUid).get();
      const friendData = friendUserDoc.data();

      return {
        name: friendData.displayName,
        uid: friendUid,
        status: status,
        docId: friendDocument.id
      };
    }),
  );

  return results;
};

const getFriendStatus = async (uid1, uid2) => {
  try {
    const friendsRef = db.collection("friends");
    const documents = await friendsRef.where(
      Filter.and(
        Filter.or(
          Filter.where('user1', '==', uid1),
          Filter.where('user2', '==', uid1)
        ),
        Filter.or(
          Filter.where('user1', '==', uid2),
          Filter.where('user2', '==', uid2)
        )
      )
    ).get();
    if (documents.empty) return null;

    const document = documents.docs[0];
    return document.data().status;
  } catch (error) {
    console.error("Error getting friend status", error);
  }
}

const getUserByUID = async (uid) => {
  try {
    const userRef = db.collection("users").doc(uid);
    const document = await userRef.get();
    if (!document.exists) return null;
    return document.data();
  } catch (error) {
    console.error("Error getting user", uid, error)
  }
}

const getMatchHistoryByUID = async (uid) => {
  try {
    const gamesRef = db.collection("game_instances");
    const games = await gamesRef.where(
      Filter.and(
        Filter.or(
          Filter.where('b.uid', '==', uid),
          Filter.where('w.uid', '==', uid)
        ),
        Filter.where('status', '==', "complete")
      )
    )
      .get();
    const matchHistory = [];
    games.forEach((game) => {
      matchHistory.push(game.data())
    })
    return matchHistory
  } catch (error) {
    console.error("Error getting match history for uid:", uid, "with error", error);
  }
}

const createChallengeRequest = async (challenger, challenged) => {
  try {
    const requestsRef = db.collection("challenge_requests");
    const data = {
      challenger: challenger,
      challenged: challenged,
      createdAt: Date.now(),
      status: "pending"
    };

    const document = await requestsRef.add(data);
    console.log(document.id, "challenge request has been created!");
    return document.id;
  } catch (error) {
    console.error("error creating challenge Request:", error)
  }
}

const acceptChallengeRequest = async (challengeId) => {
  try {
    const requestsRef = db.collection("challenge_requests");
    const document = requestsRef.doc(challengeId);
    const response = await document.update({ status: "accepted" });
    const data = await document.get();
    console.log("accepted challenge request", response);
    return data.data();
  } catch (error) {
    console.error("Error accepting challenge request in database:", error);
  }
}

const denyChallengeRequest = async (challengeId) => {
  try {
    const requestsRef = db.collection("challenge_requests");
    const document = requestsRef.doc(challengeId);
    const response = await document.update({ status: "rejected" });
    console.log("rejected challenge request", response);
  } catch (error) {
    console.error("Error rejecting challenge request in database:", error);
  }
}

const getChallengeRequest = async (challengeId) => {
  try {
    const requestsRef = db.collection("challenge_requests").doc(challengeId);
    const document = await requestsRef.get();
    return document.data();
  } catch (error) {
    console.error("Error reading document:", error)
  }
}

const createGameInstanceFromChallenge = async (challengeId) => {
  try {
    const challengeData = await getChallengeRequest(challengeId);
    if (!challengeData) return -1;
    if (challengeData.status != "accepted") return -1;

    // randomize white and black
    let players = [challengeData.challenger, challengeData.challenged];
    players = players.sort(() => .5 - Math.random()).slice(0, 2); //shuffle method from stackoverflow: 9719434
    const whiteUID = players[0];
    const whitePlayer = await getUserByUID(whiteUID)
    const blackUID = players[1];
    const blackPlayer = await getUserByUID(blackUID)
    const board = createBoard();
    const flatBoard = board.flat()

    const data = {
      messages: [],
      board: flatBoard,
      w: {
        uid: whiteUID,
        name: whitePlayer.displayName
      },
      b: {
        uid: blackUID,
        name: blackPlayer.displayName
      },
      player_turn: "w",
      turn: 0,
      status: "active",
      date_started: new Date().toDateString(),
      last_updated: new Date().toDateString()
    }

    console.log(data);

    const gameInstancesRef = db.collection("game_instances");
    const document = await gameInstancesRef.add(data);
    return document.id
  } catch (error) {
    console.error("Error creating game instance in database:", error);
  }
}

const createGameInstance = async (player1, player2) => {
  try {
    // randomize white and black
    let players = [player1, player2];
    players = players.sort(() => .5 - Math.random()).slice(0, 2); //shuffle method from stackoverflow: 9719434
    const whiteUID = players[0];
    const whitePlayer = await getUserByUID(whiteUID)
    const blackUID = players[1];
    const blackPlayer = await getUserByUID(blackUID)
    const board = createBoard();
    const flatBoard = board.flat()

    const data = {
      messages: [],
      board: flatBoard,
      w: {
        uid: whiteUID,
        name: whitePlayer.displayName
      },
      b: {
        uid: blackUID,
        name: blackPlayer.displayName
      },
      player_turn: "w",
      turn: 0,
      status: "active",
      date_started: new Date().toDateString(),
      last_updated: new Date().toDateString()
    }

    console.log(data);

    const gameInstancesRef = db.collection("game_instances");
    const document = await gameInstancesRef.add(data);
    return document.id
  } catch (error) {
    console.error("Error creating game instance in database:", error);
  }
}


const getGameInstance = async (gameID) => {
  try {
    const gameRef = db.collection("game_instances").doc(gameID);
    const document = await gameRef.get();
    return document.data();
  } catch (error) {
    console.error("Error retrieving game instance:", error);
  }
}

const updateGameInstance = async (gameID, gameData) => {
  try {
    const gameRef = db.collection("game_instances").doc(gameID);
    await gameRef.set(gameData);
    console.log("updated game instance:", gameID);
  } catch (error) {
    console.error("Error updating game instance in database:", error);
  }
}

const setWinnerGameInstance = async (gameID, winner) => {
  try {
    const gameRef = db.collection("game_instances").doc(gameID);
    const document = await gameRef.get();
    const data = document.data();

    winner = winner == "w" ? data.w : data.b;
    await gameRef.update({ status: "complete", winner: winner });
  } catch (error) {
    console.error("Error setting winner in game instance:", error);
  }
}

const getUsersActiveGames = async (uid) => {
  try {
    const gamesRef = db.collection("game_instances");
    const games = await gamesRef.where(
      Filter.or(
        Filter.where('b.uid', '==', uid),
        Filter.where('w.uid', '==', uid)
      )
    )
      .get();
    let response = await Promise.all(
      games.docs.map(async game => {
        const gameData = game.data();
        if (gameData.status != "active") return {};

        const playerTeam = uid == gameData.w.uid ? "w" : "b";
        const opponentUid = playerTeam == "w" ? gameData.b.uid : gameData.w.uid;
        const opponent = await getUserByUID(opponentUid);
        if (!opponent) return {};

        return {
          gameId: game.id,
          turns: gameData.turn,
          toPlay: playerTeam == gameData.player_turn ? true : false,
          opponent: opponent.displayName
        }
      })
    );
    response = response.filter(game => Object.keys(game).length !== 0);
    return response;
  } catch (error) {
    console.error("Error retrieving games", error);
  }
}

const createFriendRequest = async (from, to) => {
  try {
    const friendsRef = db.collection("friends");
    const data = {
      user1: from,
      user2: to,
      status: "pending",
    }
    const document = await friendsRef.add(data);
    return document.id;
  } catch (error) {
    console.error("Error creating friend request", error);
  }
}

const acceptFriendRequest = async (reqId) => {
  try {
    const requestRef = db.collection("friends").doc(reqId);
    const response = await requestRef.update({ status: "accepted" });
    return response
  } catch (error) {
    console.error("Error accepting friend request", error);
  }
}

const denyFriendRequest = async (reqId) => {
  try {
    const requestRef = db.collection("friends").doc(reqId);
    const response = await requestRef.delete();
    return response
  } catch (error) {
    console.error("Error denying friend request", error);
  }
}
const joinQueue = async (uid) => {
  try {
    const queueRef = db.collection("queues").doc("standard");
    const queueDocument = await queueRef.get();
    const queueData = await queueDocument.data();
    let queue = queueData.in_queue;


    if (!queue.find((player) => player == uid)) {
      queue.push(uid);
      queueRef.update({in_queue: queue}).then(res => {
        return res;
      });
    } else {
      return -1;
    }

    // insane matchmaking 
    if (queue.length >= 2) {
      const [player1, player2] = queue.sort(() => 0.5 - Math.random()).slice(0, 2);
      const game = await createGameInstance(player1, player2);
      queue = queue.filter(player => player !== player1 && player !== player2);
      await queueRef.update({ in_queue: queue });

      return {player1: player1, player2: player2, game: game};
    }

  } catch (error) {
    console.error("Error joining queue", error);
  }
}

const leaveQueue = async (uid) => {
  try {
    const queueRef = db.collection("queues").doc("standard");
    const queueDocument = await queueRef.get();
    const queueData = await queueDocument.data();
    let queue = queueData.in_queue;
    queue = queue.filter((player) => player != uid);
    queueRef.update({in_queue: queue}).then(res => {
      return res;
    });
  } catch (error) {
    console.error("Error leaving queue", error);
  }
}

const checkQueueStatus = async (queue, uid) => {
  try {
    const queueRef = db.collection("queues").doc(queue);
    const queueDocument = await queueRef.get();
    const queueData = await queueDocument.data();
    const queueArray = queueData.in_queue;
    
    let inQueue = false;
    if (queueArray.find((player) => player == uid)) {
      inQueue = true;
    }
    const data = {
      queue_status: inQueue,
      queue_count: queueArray.length
    };

    return data;
  } catch (error) {
    console.error("Error getting queue status", error);
  }
}

const sendMessageToGameChat = async (sender, message, gameId) => {
  try {
    const gameRef = db.collection("game_instances").doc(gameId);
    const gameDocumentRef = await gameRef.get();
    const gameDocumentData = await gameDocumentRef.data();
    let messages = gameDocumentData.messages;

    messages.push({sender: sender, message: message});
    const response = await gameRef.update({messages: messages});
    return messages;
  } catch (error) {
    console.error("Error sending message", error);
  }
}

const getMessagesFromGameChat = async (gameId) => {
  try {
    const gameRef = db.collection("game_instances").doc(gameId);
    const gameDocumentRef = await gameRef.get();
    const gameDocumentData = await gameDocumentRef.data();
    return gameDocumentData.messages;
  } catch (error) {
    console.error("Error getting game messages", error);
  }
}

module.exports = {
  addUserToDatabase: addUserToDatabase,
  getFriendsFromUID: getFriendsFromUID,
  getFriendStatus: getFriendStatus,
  getUserByUID: getUserByUID,
  getMatchHistoryByUID: getMatchHistoryByUID,
  createChallengeRequest: createChallengeRequest,
  acceptChallengeRequest: acceptChallengeRequest,
  denyChallengeRequest: denyChallengeRequest,
  createGameInstanceFromChallenge: createGameInstanceFromChallenge,
  createGameInstance: createGameInstance,
  getGameInstance: getGameInstance,
  updateGameInstance: updateGameInstance,
  setWinnerGameInstance: setWinnerGameInstance,
  getUsersActiveGames: getUsersActiveGames,
  createFriendRequest: createFriendRequest,
  acceptFriendRequest: acceptFriendRequest,
  denyFriendRequest: denyFriendRequest,
  joinQueue: joinQueue,
  leaveQueue: leaveQueue,
  checkQueueStatus: checkQueueStatus,
  sendMessageToGameChat: sendMessageToGameChat,
  getMessagesFromGameChat: getMessagesFromGameChat
};
