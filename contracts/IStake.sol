// SPDX-License-Identifier: MIT

pragma solidity 0.8.1;

/**
 * @dev Interface contains all of the events necessary for staking Vega token
 */
interface IStake {
  event Stake_Deposited(address indexed user, uint256 amount, bytes32 indexed vega_public_key);
  event Stake_Removed(address indexed user, uint256 amount, bytes32 indexed vega_public_key);
  event Stake_Transferred(address indexed from, uint256 amount, address indexed to, bytes32 indexed vega_public_key);
}
