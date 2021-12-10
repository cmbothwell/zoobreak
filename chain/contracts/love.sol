// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/*
    ███████╗ ██████╗  ██████╗ ██████╗ ██████╗ ███████╗ █████╗ ██╗  ██╗
    ╚══███╔╝██╔═══██╗██╔═══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗██║ ██╔╝
      ███╔╝ ██║   ██║██║   ██║██████╔╝██████╔╝█████╗  ███████║█████╔╝
     ███╔╝  ██║   ██║██║   ██║██╔══██╗██╔══██╗██╔══╝  ██╔══██║██╔═██╗
    ███████╗╚██████╔╝╚██████╔╝██████╔╝██║  ██║███████╗██║  ██║██║  ██╗
    ╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
    ZooBreak / 2021 / V1.0
*/

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LOVE is ERC20("LOVE", "LOVE") {
    address public ZOO;

    event LoveRewarded(address indexed user, uint256 loveReward);

    modifier onlyZOO() {
        require((msg.sender == ZOO), "Only ZOO can call this");
        _;
    }

    constructor(address _zoo) public {
        ZOO = _zoo;
    }

    function rewardLove(address _to, uint256 _amount) external onlyZOO {
        _mint(_to, _amount);
        emit LoveRewarded(_to, _amount);
    }

    function burnLove(address _from, uint256 _amount) external onlyZOO {
        _burn(_from, _amount);
    }
}