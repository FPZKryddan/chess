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
  getUser1.forEach((doc) => friends.push(doc.data()));
  getUser2.forEach((doc) => friends.push(doc.data()));

  const results = await Promise.all(
    friends.map(async (friendsObj) => {
      const friendUid =
        friendsObj.user1 === uid ? friendsObj.user2 : friendsObj.user1;
      const status = friendsObj.status;

      const friendDoc = await usersRef.doc(friendUid).get();
      const friendData = friendDoc.data();

      return {
        name: friendData.displayName,
        uid: friendUid,
        status: status,
      };
    }),
  );

  return results;
};

const getUserByUID = async (uid) => {
  const userRef = db.collection("users").doc(uid);
  const document = await userRef.get();
  if (!document.exists) return null;
  return document.data();
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
    const response = await document.update({status: "accepted"});
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
    const response = await document.update({status: "rejected"});
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
  } catch(error) {
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
    const white = players[0];
    const black = players[1];
    const board = createBoard();
    const flatBoard = board.flat()

    const data = {
      board: flatBoard,
      w: white,
      b: black,
      player_turn: "w",
      turn: 0,
      status: "active"
    }

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
    await gameRef.update({status: "complete", winner: winner});
  } catch (error) {
    console.error("Error setting winner in game instance:", error);
  }
}

const getUsersActiveGames = async (uid) => {
  try {
    const gamesRef = db.collection("game_instances");
    const games = await gamesRef.where(
      Filter.or(
        Filter.where('b', '==', uid),
        Filter.where('w', '==', uid)
      )
    )
    .get();
    let response = await Promise.all(
      games.docs.map(async game =>  {
        const gameData = game.data();
        if (gameData.status != "active") return {};

        const playerTeam = uid == gameData.w ? "w" : "b";
        const opponentUid = playerTeam == "w" ? gameData.b : gameData.w;
        const opponent = await getUserByUID(opponentUid); 

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

module.exports = {
  addUserToDatabase: addUserToDatabase,
  getFriendsFromUID: getFriendsFromUID,
  getUserByUID: getUserByUID,
  createChallengeRequest: createChallengeRequest,
  acceptChallengeRequest: acceptChallengeRequest,
  denyChallengeRequest: denyChallengeRequest,
  createGameInstanceFromChallenge: createGameInstanceFromChallenge,
  getGameInstance: getGameInstance,
  updateGameInstance: updateGameInstance,
  setWinnerGameInstance: setWinnerGameInstance,
  getUsersActiveGames: getUsersActiveGames,
};
