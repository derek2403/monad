// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract BallGame {
    uint8 constant BALL_COUNT = 50;

    // Ball types: 0 = Normal (1pt), 1 = Special (3pt), 2 = Bomb (-5pt, min 0)
    struct Game {
        uint256 startTime;
        uint16[50] xs;
        uint16[50] ys;
        uint8[50] ballTypes;
        address[50] claimedBy;
        uint8 claimedCount;
    }

    uint256 public currentGameId;
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public scores;

    event GameStarted(uint256 indexed gameId, uint256 startTime, uint16[50] xs, uint16[50] ys, uint8[50] ballTypes);
    event BallClaimed(uint256 indexed gameId, uint8 index, address player, uint8 ballType, uint256 newScore);
    event GameEnded(uint256 indexed gameId, address endedBy);
    event BallsRegenerated(uint256 indexed gameId, uint256 startTime, uint16[50] xs, uint16[50] ys, uint8[50] ballTypes);

    function startGame() external {
        if (currentGameId > 0) {
            require(games[currentGameId].claimedCount == BALL_COUNT, "Current game still active");
        }

        currentGameId++;
        Game storage g = games[currentGameId];
        g.startTime = block.timestamp;

        uint256 seed = uint256(keccak256(abi.encodePacked(block.prevrandao, currentGameId)));

        // Fixed distribution: 35 Normal, 5 Special, 10 Bomb — then shuffle
        uint8[50] memory types;
        // 0..34 = Normal (already 0 by default)
        // 35..39 = Special
        for (uint8 i = 35; i < 40; i++) { types[i] = 1; }
        // 40..49 = Bomb
        for (uint8 i = 40; i < 50; i++) { types[i] = 2; }

        // Fisher-Yates shuffle
        for (uint8 i = 49; i > 0; i--) {
            uint256 r = uint256(keccak256(abi.encodePacked(seed, i, uint8(99)))) % (i + 1);
            (types[i], types[uint8(r)]) = (types[uint8(r)], types[i]);
        }

        for (uint8 i = 0; i < BALL_COUNT; i++) {
            uint256 hash = uint256(keccak256(abi.encodePacked(seed, i)));
            g.xs[i] = uint16(hash % 801) + 100;
            g.ys[i] = uint16((hash >> 16) % 801) + 100;
            g.ballTypes[i] = types[i];
        }

        emit GameStarted(currentGameId, g.startTime, g.xs, g.ys, g.ballTypes);
    }

    function regenerateBalls() external {
        require(currentGameId > 0, "No active game");
        Game storage g = games[currentGameId];
        require(g.claimedCount < BALL_COUNT, "Game already finished");

        // Reset all claims
        for (uint8 i = 0; i < BALL_COUNT; i++) {
            g.claimedBy[i] = address(0);
        }
        g.claimedCount = 0;
        g.startTime = block.timestamp;

        // Generate new positions and ball types
        uint256 seed = uint256(keccak256(abi.encodePacked(block.prevrandao, currentGameId, block.timestamp)));

        uint8[50] memory types;
        for (uint8 i = 35; i < 40; i++) { types[i] = 1; }
        for (uint8 i = 40; i < 50; i++) { types[i] = 2; }

        for (uint8 i = 49; i > 0; i--) {
            uint256 r = uint256(keccak256(abi.encodePacked(seed, i, uint8(99)))) % (i + 1);
            (types[i], types[uint8(r)]) = (types[uint8(r)], types[i]);
        }

        for (uint8 i = 0; i < BALL_COUNT; i++) {
            uint256 hash = uint256(keccak256(abi.encodePacked(seed, i)));
            g.xs[i] = uint16(hash % 801) + 100;
            g.ys[i] = uint16((hash >> 16) % 801) + 100;
            g.ballTypes[i] = types[i];
        }

        emit BallsRegenerated(currentGameId, g.startTime, g.xs, g.ys, g.ballTypes);
    }

    function endGame() external {
        require(currentGameId > 0, "No active game");
        Game storage g = games[currentGameId];
        require(g.claimedCount < BALL_COUNT, "Game already finished");
        g.claimedCount = BALL_COUNT;
        emit GameEnded(currentGameId, msg.sender);
    }

    function claimBall(uint8 index) external {
        require(currentGameId > 0, "No active game");
        require(index < BALL_COUNT, "Invalid ball index");

        Game storage g = games[currentGameId];
        require(g.claimedCount < BALL_COUNT, "Game already finished");
        require(g.claimedBy[index] == address(0), "Ball already claimed");

        g.claimedBy[index] = msg.sender;
        g.claimedCount++;

        uint8 ballType = g.ballTypes[index];
        if (ballType == 0) {
            scores[msg.sender] += 1;
        } else if (ballType == 1) {
            scores[msg.sender] += 3;
        } else if (ballType == 2) {
            if (scores[msg.sender] >= 5) {
                scores[msg.sender] -= 5;
            } else {
                scores[msg.sender] = 0;
            }
        }

        emit BallClaimed(currentGameId, index, msg.sender, ballType, scores[msg.sender]);
    }

    function getGamePositions(uint256 gameId) external view returns (uint16[50] memory xs, uint16[50] memory ys) {
        Game storage g = games[gameId];
        return (g.xs, g.ys);
    }

    function getGameBallTypes(uint256 gameId) external view returns (uint8[50] memory) {
        return games[gameId].ballTypes;
    }

    function getGameClaims(uint256 gameId) external view returns (address[50] memory claimedBy, uint8 claimedCount) {
        Game storage g = games[gameId];
        return (g.claimedBy, g.claimedCount);
    }

    function getGameStartTime(uint256 gameId) external view returns (uint256) {
        return games[gameId].startTime;
    }

    function isGameActive() external view returns (bool) {
        if (currentGameId == 0) return false;
        return games[currentGameId].claimedCount < BALL_COUNT;
    }

    function getScore(address player) external view returns (uint256) {
        return scores[player];
    }
}
