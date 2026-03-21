// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract SignalForceLedger is Ownable, Pausable {
    enum ActionType {
        POST,
        COMMENT,
        LIKE
    }

    struct ActionAnchor {
        string actionId;
        string parentId;
        address author;
        bytes32 contentHash;
        ActionType actionType;
        uint256 timestamp;
    }

    struct ReputationCheckpoint {
        address wallet;
        uint256 reputationScore;
        string rank;
        uint256 timestamp;
    }

    ActionAnchor[] private anchors;
    mapping(address => uint256[]) private anchorIndexesByAuthor;

    mapping(bytes32 => bool) private usedActionKeys;
    mapping(bytes32 => bool) private postExists;

    ReputationCheckpoint[] private reputationCheckpoints;
    mapping(address => uint256[]) private reputationIndexesByWallet;

    mapping(address => uint256) public creatorBalances;

    event ActionAnchored(
        string indexed actionId,
        string indexed parentId,
        address indexed author,
        bytes32 contentHash,
        ActionType actionType,
        uint256 timestamp
    );

    event ReputationCheckpointRecorded(
        address indexed wallet,
        uint256 reputationScore,
        string rank,
        uint256 timestamp
    );

    event SubscriptionRecorded(
        address indexed subscriber,
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );

    event CreatorWithdrawal(address indexed creator, uint256 amount, uint256 timestamp);

    constructor() Ownable(msg.sender) {}

    function recordPost(string calldata postId, bytes32 postHash) external whenNotPaused {
        require(bytes(postId).length > 0, "post id required");
        require(postHash != bytes32(0), "post hash required");

        bytes32 postKey = _buildActionKey("POST", postId);
        require(!usedActionKeys[postKey], "post already anchored");

        usedActionKeys[postKey] = true;
        postExists[_buildPostLookupKey(postId)] = true;

        _storeAnchor(
            ActionAnchor({
                actionId: postId,
                parentId: "",
                author: msg.sender,
                contentHash: postHash,
                actionType: ActionType.POST,
                timestamp: block.timestamp
            })
        );
    }

    function recordComment(
        string calldata commentId,
        string calldata postId,
        bytes32 commentHash
    ) external whenNotPaused {
        require(bytes(commentId).length > 0, "comment id required");
        require(bytes(postId).length > 0, "post id required");
        require(commentHash != bytes32(0), "comment hash required");
        require(postExists[_buildPostLookupKey(postId)], "parent post not anchored");

        bytes32 commentKey = _buildActionKey("COMMENT", commentId);
        require(!usedActionKeys[commentKey], "comment already anchored");

        usedActionKeys[commentKey] = true;

        _storeAnchor(
            ActionAnchor({
                actionId: commentId,
                parentId: postId,
                author: msg.sender,
                contentHash: commentHash,
                actionType: ActionType.COMMENT,
                timestamp: block.timestamp
            })
        );
    }

    function recordLike(string calldata likeId, string calldata postId) external whenNotPaused {
        require(bytes(likeId).length > 0, "like id required");
        require(bytes(postId).length > 0, "post id required");
        require(postExists[_buildPostLookupKey(postId)], "parent post not anchored");

        bytes32 likeKey = _buildActionKey("LIKE", likeId);
        require(!usedActionKeys[likeKey], "like already anchored");
        usedActionKeys[likeKey] = true;

        _storeAnchor(
            ActionAnchor({
                actionId: likeId,
                parentId: postId,
                author: msg.sender,
                contentHash: bytes32(0),
                actionType: ActionType.LIKE,
                timestamp: block.timestamp
            })
        );
    }

    function recordReputationCheckpoint(
        address wallet,
        uint256 reputationScore,
        string calldata rank
    ) external whenNotPaused {
        require(wallet != address(0), "wallet required");
        require(bytes(rank).length > 0, "rank required");
        require(msg.sender == wallet || msg.sender == owner(), "not allowed");
        require(reputationScore <= 10000, "score out of range");

        ReputationCheckpoint memory checkpoint = ReputationCheckpoint({
            wallet: wallet,
            reputationScore: reputationScore,
            rank: rank,
            timestamp: block.timestamp
        });

        reputationCheckpoints.push(checkpoint);
        reputationIndexesByWallet[wallet].push(reputationCheckpoints.length - 1);

        emit ReputationCheckpointRecorded(wallet, reputationScore, rank, block.timestamp);
    }

    function recordSubscription(address creator) external payable whenNotPaused {
        require(creator != address(0), "creator required");
        require(creator != msg.sender, "cannot self subscribe");
        require(msg.value > 0, "amount required");

        creatorBalances[creator] += msg.value;
        emit SubscriptionRecorded(msg.sender, creator, msg.value, block.timestamp);
    }

    function withdrawCreatorEarnings() external whenNotPaused {
        uint256 amount = creatorBalances[msg.sender];
        require(amount > 0, "no funds");

        creatorBalances[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "withdraw failed");

        emit CreatorWithdrawal(msg.sender, amount, block.timestamp);
    }

    function getMyAnchors() external view returns (ActionAnchor[] memory) {
        uint256[] memory indexes = anchorIndexesByAuthor[msg.sender];
        ActionAnchor[] memory result = new ActionAnchor[](indexes.length);

        for (uint256 i = 0; i < indexes.length; i++) {
            result[i] = anchors[indexes[i]];
        }

        return result;
    }

    function getAnchorsByAuthor(address author) external view returns (ActionAnchor[] memory) {
        uint256[] memory indexes = anchorIndexesByAuthor[author];
        ActionAnchor[] memory result = new ActionAnchor[](indexes.length);

        for (uint256 i = 0; i < indexes.length; i++) {
            result[i] = anchors[indexes[i]];
        }

        return result;
    }

    function getAllAnchors() external view returns (ActionAnchor[] memory) {
        return anchors;
    }

    function totalAnchors() external view returns (uint256) {
        return anchors.length;
    }

    function getReputationByWallet(address wallet) external view returns (ReputationCheckpoint[] memory) {
        uint256[] memory indexes = reputationIndexesByWallet[wallet];
        ReputationCheckpoint[] memory result = new ReputationCheckpoint[](indexes.length);

        for (uint256 i = 0; i < indexes.length; i++) {
            result[i] = reputationCheckpoints[indexes[i]];
        }

        return result;
    }

    function totalReputationCheckpoints() external view returns (uint256) {
        return reputationCheckpoints.length;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _storeAnchor(ActionAnchor memory anchor) private {
        anchors.push(anchor);
        anchorIndexesByAuthor[msg.sender].push(anchors.length - 1);

        emit ActionAnchored(
            anchor.actionId,
            anchor.parentId,
            anchor.author,
            anchor.contentHash,
            anchor.actionType,
            anchor.timestamp
        );
    }

    function _buildActionKey(string memory kind, string memory id) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(kind, ":", id));
    }

    function _buildPostLookupKey(string memory postId) private pure returns (bytes32) {
        return keccak256(abi.encodePacked("POST_LOOKUP:", postId));
    }
}
