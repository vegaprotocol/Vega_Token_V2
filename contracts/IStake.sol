// SPDX-License-Identifier: MIT

pragma solidity 0.8.1;

/**
 * @dev Interface contains all of the events necessary for staking Vega token
 */
interface IStake {
  event Stake_Deposited(address indexed user, uint256 amount, bytes32 indexed vega_public_key);
  event Stake_Removed(address indexed user, uint256 amount, bytes32 indexed vega_public_key);
  event Stake_Transferred(address indexed from, uint256 amount, address indexed to, bytes32 indexed vega_public_key);

  /// @return the address of the token that is able to be staked
  function staking_token() external view returns (address);

  /// @param target Target address to check
  /// @param vega_public_key Target vega public key to check
  /// @return the number of tokens staked for that address->vega_public_key pair
  function stake_balance(address target, bytes32 vega_public_key) external view returns (uint256);


  /// @return total tokens staked on contract
  function total_staked() external view returns (uint256);
}
