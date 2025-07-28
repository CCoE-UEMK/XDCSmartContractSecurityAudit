// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract XDCValidatorV2 is Ownable2Step, ReentrancyGuard {
    using Address for address payable;

    event Vote(address indexed voter, address indexed candidate, uint256 cap);
    event Unvote(address indexed voter, address indexed candidate, uint256 cap);
    event Propose(address indexed owner, address indexed candidate, uint256 cap);
    event Resign(address indexed owner, address indexed candidate);
    event Withdraw(address indexed owner, uint256 blockNumber, uint256 cap);
    event UploadedKYC(address indexed owner, string kycHash);
    event InvalidatedNode(address indexed masternodeOwner, address[] masternodes);
    event OwnershipTransferredOnNode(address indexed previousOwner, address indexed newOwner, address indexed candidate);
    event RewardsAdded(address indexed recipient, uint256 amount);
    event RewardsWithdrawn(address indexed recipient, uint256 amount);
    event FundsReceived(address indexed sender, uint256 amount);

    struct ValidatorState {
        address owner;
        bool isCandidate;
        uint256 cap;
        mapping(address => uint256) voters;
    }

    struct WithdrawState {
        mapping(uint256 => uint256) caps;
        uint256[] blockNumbers;
    }

    mapping(address => WithdrawState) private _withdrawsState;
    mapping(address => ValidatorState) private _validatorsState;
    mapping(address => address[]) private _voters;
    mapping(address => string[]) public kycStrings;
    mapping(address => uint256) public invalidKYCCount;
    mapping(address => mapping(address => bool)) public hasVotedInvalid;
    mapping(address => address[]) private _ownerToCandidate;
    mapping(address => uint256) public pendingRewards;

    address[] private _owners;
    address[] private _candidates;

    uint256 public candidateCount;
    uint256 public ownerCount;
    uint256 public immutable minCandidateCap;
    uint256 public immutable minVoterCap;
    uint256 public immutable maxValidatorNumber;
    uint256 public immutable candidateWithdrawDelay;
    uint256 public immutable voterWithdrawDelay;

    modifier onlyOwnerOfCandidate(address candidate) {
        require(_validatorsState[candidate].owner == msg.sender, "Not owner of candidate");
        _;
    }

    modifier onlyValidCandidate(address candidate) {
        require(_validatorsState[candidate].isCandidate, "Not a valid candidate");
        _;
    }

    modifier onlyNotCandidate(address candidate) {
        require(!_validatorsState[candidate].isCandidate, "Already a candidate");
        _;
    }

    modifier onlyValidVote(address candidate, uint256 cap) {
        uint256 voterCap = _validatorsState[candidate].voters[msg.sender];
        require(voterCap >= cap, "Insufficient vote cap");
        if (_validatorsState[candidate].owner == msg.sender) {
            require(voterCap - cap >= minCandidateCap, "Below min cap");
        }
        _;
    }

    modifier onlyValidWithdraw(uint256 blockNumber, uint256 index) {
        require(blockNumber != 0 && block.number >= blockNumber, "Withdraw conditions not met");
        require(_withdrawsState[msg.sender].caps[blockNumber] != 0, "Nothing to withdraw");
        require(_withdrawsState[msg.sender].blockNumbers[index] == blockNumber, "Index mismatch");
        _;
    }

    constructor(
        address[] memory initialCandidates,
        uint256[] memory caps,
        address firstOwner,
        uint256 _minCandidateCap,
        uint256 _minVoterCap,
        uint256 _maxValidatorNumber,
        uint256 _candidateWithdrawDelay,
        uint256 _voterWithdrawDelay
    ) Ownable(firstOwner) {
        require(firstOwner != address(0), "Zero address owner");

        minCandidateCap = _minCandidateCap;
        minVoterCap = _minVoterCap;
        maxValidatorNumber = _maxValidatorNumber;
        candidateWithdrawDelay = _candidateWithdrawDelay;
        voterWithdrawDelay = _voterWithdrawDelay;

        _owners.push(firstOwner);
        ownerCount++;
        candidateCount = initialCandidates.length;
	require(initialCandidates.length <= maxValidatorNumber, "Too many initial candidates");

        for (uint256 i = 0; i < initialCandidates.length; ++i) {
            address candidate = initialCandidates[i];
            require(candidate != address(0), "Zero candidate");
            _candidates.push(candidate);

            ValidatorState storage v = _validatorsState[candidate];
            v.owner = firstOwner;
            v.isCandidate = true;
            v.cap = caps[i];
            v.voters[firstOwner] = _minCandidateCap;

            _voters[candidate].push(firstOwner);
            _ownerToCandidate[firstOwner].push(candidate);
        }
    }

    function uploadKYC(string memory kycHash) external {
        kycStrings[msg.sender].push(kycHash);
        emit UploadedKYC(msg.sender, kycHash);
    }

    function propose(address candidate) external payable onlyNotCandidate(candidate) {
        require(candidate != address(0), "Zero candidate");
        require(msg.value >= minCandidateCap, "Insufficient cap");
        require(kycStrings[msg.sender].length != 0 || _ownerToCandidate[msg.sender].length != 0, "Not KYCed");

        _candidates.push(candidate);
        ValidatorState storage v = _validatorsState[candidate];
        v.owner = msg.sender;
        v.isCandidate = true;
        v.cap = msg.value;
        v.voters[msg.sender] = msg.value;

        candidateCount++;
        if (_ownerToCandidate[msg.sender].length == 0) {
            _owners.push(msg.sender);
            ownerCount++;
        }

        _ownerToCandidate[msg.sender].push(candidate);
        _voters[candidate].push(msg.sender);
        emit Propose(msg.sender, candidate, msg.value);
    }

    function vote(address candidate) external payable onlyValidCandidate(candidate) {
        require(msg.value >= minVoterCap, "Below min voter cap");

        ValidatorState storage v = _validatorsState[candidate];
        v.cap += msg.value;
        if (v.voters[msg.sender] == 0) {
            _voters[candidate].push(msg.sender);
        }
        v.voters[msg.sender] += msg.value;

        emit Vote(msg.sender, candidate, msg.value);
    }

    function transferOwnershipOnNode(address candidate, address newOwner)
        external onlyOwnerOfCandidate(candidate) onlyValidCandidate(candidate)
    {
        require(newOwner != address(0), "Zero new owner");

        ValidatorState storage validator = _validatorsState[candidate];
        address previousOwner = validator.owner;
        validator.owner = newOwner;

        _removeCandidateFromOwner(previousOwner, candidate);
        _ownerToCandidate[newOwner].push(candidate);

        emit OwnershipTransferredOnNode(previousOwner, newOwner, candidate);
    }

// This function is added to withstand the candidate resign atatck
function resign(address candidate) external onlyOwnerOfCandidate(candidate) onlyValidCandidate(candidate) {
    // Remove the candidate from the list
    address[] storage allCandidates = _candidates;
	require(_candidates.length <= maxValidatorNumber, "Too many candidates to resign");
    for (uint256 i = 0; i < allCandidates.length; ++i) {
        if (allCandidates[i] == candidate) {
            allCandidates[i] = allCandidates[allCandidates.length - 1];
            allCandidates.pop();
            break;
        }
    }

    // Update validator state
    _validatorsState[candidate].isCandidate = false;
    candidateCount--;

    // Remove from owner's candidate list
    _removeCandidateFromOwner(msg.sender, candidate);

    emit Resign(msg.sender, candidate);
}

//Function ends here.

function transferOwnership(address newOwner) public override onlyOwner {
        require(newOwner != address(0), "New owner is zero address");
        super.transferOwnership(newOwner);
    }
    function distributeRewards(address[] calldata recipients, uint256[] calldata amounts)
        external onlyOwner
    {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length <= 100, "Batch too large");
	

        for (uint256 i = 0; i < recipients.length; ++i) {
            pendingRewards[recipients[i]] += amounts[i];
            emit RewardsAdded(recipients[i], amounts[i]);
        }
    }

    function withdrawRewards() external nonReentrant {
        uint256 amount = pendingRewards[msg.sender];
        require(amount != 0, "No rewards to withdraw");

        delete pendingRewards[msg.sender];
        payable(msg.sender).sendValue(amount);

        emit RewardsWithdrawn(msg.sender, amount);
    }

    function withdraw(uint256 blockNumber, uint256 index)
        external onlyValidWithdraw(blockNumber, index) nonReentrant
    {
        uint256 cap = _withdrawsState[msg.sender].caps[blockNumber];
        delete _withdrawsState[msg.sender].caps[blockNumber];

        uint256 len = _withdrawsState[msg.sender].blockNumbers.length;
        _withdrawsState[msg.sender].blockNumbers[index] = _withdrawsState[msg.sender].blockNumbers[len - 1];
        _withdrawsState[msg.sender].blockNumbers.pop();

        payable(msg.sender).sendValue(cap);

        emit Withdraw(msg.sender, blockNumber, cap);
    }

    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    function _removeCandidateFromOwner(address ownerAddr, address candidateAddr) internal {
        address[] storage ownerCandidates = _ownerToCandidate[ownerAddr];
        uint256 len = ownerCandidates.length;
	require(len <= 100, "Too many owned candidates to remove safely");
        for (uint256 i = 0; i < len; ++i) {
            if (ownerCandidates[i] == candidateAddr) {
                ownerCandidates[i] = ownerCandidates[len - 1];
                ownerCandidates.pop();
                break;
            }
        }
    }

    // Getters
    function getCandidates() external view returns (address[] memory) { return _candidates; }
    function getCandidateCap(address candidate) external view returns (uint256) { return _validatorsState[candidate].cap; }
    function getCandidateOwner(address candidate) external view returns (address) { return _validatorsState[candidate].owner; }
    function getVoterCap(address candidate, address voter) external view returns (uint256) { return _validatorsState[candidate].voters[voter]; }
    function getVoters(address candidate) external view returns (address[] memory) { return _voters[candidate]; }
    function isCandidate(address candidate) external view returns (bool) { return _validatorsState[candidate].isCandidate; }
    function getWithdrawBlockNumbers() external view returns (uint256[] memory) { return _withdrawsState[msg.sender].blockNumbers; }
    function getWithdrawCap(uint256 blockNumber) external view returns (uint256) { return _withdrawsState[msg.sender].caps[blockNumber]; }
}
