// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BallotToken is ERC20 {
    
    constructor(
        string memory name,
        string memory symbol,
        address owner
    ) ERC20(name, symbol) {
        _mint(owner, 10000);
    }
    
    function burn(address account, uint256 amount) public{
        _burn(account, amount);
    }
}

contract BallotTokenFactory {
    function createERC20(
        string memory name,
        string memory symbol
    ) public returns (address) {
        return address(new BallotToken(name, symbol, msg.sender));
    }
}