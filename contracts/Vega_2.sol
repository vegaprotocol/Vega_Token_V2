// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import "./ERC20.sol";

/// @title Vega 2 Token
/// @author Vega Protocol
/// @notice This contract is the Vega V2 ERC20 token that replaces the initial VEGA token
contract Vega_2 is ERC20 {

  event Controller_Changed(address indexed new_controller);

  /// @notice Timestamp of when mint becomes available to the current controller of the token
  uint256 public mint_lock_expiry;
  /// @notice Address of the controller of this contract (similar to "owner" in other contracts)
  address public controller;

  /// @notice Constructor mints and issues total_supply_to the address that deploys the contract
  /// @dev Runs ERC20 _mint function
  /// @param total_supply_ The initial supply to mint, these will be the only tokens minted until after mint_lock_expiry
  /// @param mint_lock_expiry_ The timestamp of when the mint_and_issue function becomes available to the controller
  /// @param name_ The name of the ERC20 token
  /// @param symbol_ The symbol of the ERC20 token
  /// @dev emits Controller_Changed event
  constructor(uint256 total_supply_, uint256 mint_lock_expiry_, string memory name_, string memory symbol_) ERC20 (name_, symbol_) {
      //mint and issue
      mint_lock_expiry = mint_lock_expiry_;
      _mint(msg.sender, total_supply_);
      controller = msg.sender;
      emit Controller_Changed(controller);
  }

  /// @notice This function allows the controller to assign a new controller
  /// @dev Emits Controller_Changed event
  /// @param new_controller Address of the new controller
  function change_controller(address new_controller) public {
    require(msg.sender == controller, "only controller");
    controller = new_controller;
    emit Controller_Changed(new_controller);
  }

  /// @notice This function allows the controller to mint and issue tokens to the target address
  /// @notice This function is locked until mint_lock_expiry
  /// @dev Runs ERC20 _mint function
  /// @param target Target address for the newly minted tokens
  /// @param amount Amount of tokens to mint and issue
  function mint_and_issue(address target, uint256 amount) public {
    require(block.timestamp > mint_lock_expiry, "minting is locked");
    require(msg.sender == controller, "only controller");
    _mint(target, amount);
  }
}

/**
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMWEMMMMMMMMMMMMMMMMMMMMMMMMMM...............MMMMMMMMMMMMM
MMMMMMLOVEMMMMMMMMMMMMMMMMMMMMMM...............MMMMMMMMMMMMM
MMMMMMMMMMHIXELMMMMMMMMMMMM....................MMMMMNNMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMM....................MMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMM88=........................+MMMMMMMMMM
MMMMMMMMMMMMMMMMM....................MMMMM...MMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMM....................MMMMM...MMMMMMMMMMMMMMM
MMMMMMMMMMMM.........................MM+..MMM....+MMMMMMMMMM
MMMMMMMMMNMM...................... ..MM?..MMM.. .+MMMMMMMMMM
MMMMNDDMM+........................+MM........MM..+MMMMMMMMMM
MMMMZ.............................+MM....................MMM
MMMMZ.............................+MM....................MMM
MMMMZ.............................+MM....................DDD
MMMMZ.............................+MM..ZMMMMMMMMMMMMMMMMMMMM
MMMMZ.............................+MM..ZMMMMMMMMMMMMMMMMMMMM
MM..............................MMZ....ZMMMMMMMMMMMMMMMMMMMM
MM............................MM.......ZMMMMMMMMMMMMMMMMMMMM
MM............................MM.......ZMMMMMMMMMMMMMMMMMMMM
MM......................ZMMMMM.......MMMMMMMMMMMMMMMMMMMMMMM
MM............... ......ZMMMMM.... ..MMMMMMMMMMMMMMMMMMMMMMM
MM...............MMMMM88~.........+MM..ZMMMMMMMMMMMMMMMMMMMM
MM.......$DDDDDDD.......$DDDDD..DDNMM..ZMMMMMMMMMMMMMMMMMMMM
MM.......$DDDDDDD.......$DDDDD..DDNMM..ZMMMMMMMMMMMMMMMMMMMM
MM.......ZMMMMMMM.......ZMMMMM..MMMMM..ZMMMMMMMMMMMMMMMMMMMM
MMMMMMMMM+.......MMMMM88NMMMMM..MMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMM+.......MMMMM88NMMMMM..MMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM*/
