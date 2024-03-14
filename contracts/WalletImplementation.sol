// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PayMeFactoryContract.sol";
import "./Wallet.sol";

contract WalletImplementation is Wallet{

    modifier onlyOwner() {
        require(msg.sender == PayMeFactoryContract(payMeFactoryContract).owner(), "Only the owner can call this function");
        _;
    }

    receive() external payable {}

    function getNativeTokenBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getERC20TokenBalance(address tokenAddress) external view returns (uint256) {
        IERC20 token = IERC20(tokenAddress);
        return token.balanceOf(address(this));
    }

    function transferNativeToken(address payable recipient, uint256 amount) external onlyOwner {
        payable(recipient).transfer(amount);
    }

    function transferERC20Token(address tokenAddress, address recipient, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        token.transfer(recipient, amount);
    }

    function receiveERC20Token(address tokenAddress, address sender, uint256 amount) external {
        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(sender, address(this), amount), "Transfer failed");
    }
}
