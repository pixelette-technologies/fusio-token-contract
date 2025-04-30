// SPDX-License-Identifier: Apache 2
pragma solidity 0.8.28;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {ERC20PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title FusioToken
 * @dev Upgradeable ERC20 token with minting, burning, pausability, and minter role.
 */
contract FusioToken is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, ERC20PausableUpgradeable, OwnableUpgradeable, UUPSUpgradeable{

    uint256 public constant MAX_SUPPLY = 1_000_000_000e18;

    error CallerNotMinter(address caller);
    error InvalidZeroAddress();

    event NewMinter(address newMinter);

    address public minter;

    /**
     * @dev Storage gap for future upgrades
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     * state-variable-assignment 
     */ 
    uint256[50] private __gap;

    /**
     * @dev Modifier to restrict functions to only the minter
     */
    modifier onlyMinter() {
        if (msg.sender != minter) {
            revert CallerNotMinter(msg.sender);
        }
        _;
    }
   
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract
     * @dev Can only be called once. Mints the full MAX_SUPPLY to the owner.
     * @param _name Name of the token
     * @param _symbol Symbol of the token
     * @param _minter Address assigned as the minter
     * @param _owner Address that receives initial supply and ownership
     */
    function initialize(string memory _name, string memory _symbol, address _minter, address _owner) public initializer {
        if (_minter == address(0) || _owner == address(0)) revert InvalidZeroAddress();

        __ERC20_init(_name, _symbol);
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();  // Initialize UUPSUpgradeable

        minter = _minter;
        _mint(_owner, MAX_SUPPLY);
    }
    
    /**
     * @notice Mints tokens to a given address
     * @dev Only callable by the minter and when not paused
     * @param _account Address to receive minted tokens
     * @param _amount Amount of tokens to mint
     */
    function mint(address _account, uint256 _amount) external onlyMinter whenNotPaused {
        require(totalSupply() + _amount <= MAX_SUPPLY, "Mint exceeds MAX_SUPPLY");
        _mint(_account, _amount);
    }

    /**
     * @notice Ensures that token transfers and burns are only executed when the contract is not paused.
     * @dev Overrides the base _update function to enforce the `whenNotPaused` modifier.
     * @param from The sender address, to, the recipient address, and value, the amount being transferred or burned.
     */
    function _update(address from, address to, uint256 value)
        internal
        virtual
        override(ERC20Upgradeable, ERC20PausableUpgradeable)
        whenNotPaused
    {
        super._update(from, to, value);
    }
    
    /**
     * @notice Updates the minter address
     * @dev Only callable by the owner
     * @param newMinter New address to be assigned as minter
     */
    function setMinter(address newMinter) external onlyOwner {
        if (newMinter == address(0)) {
            revert InvalidZeroAddress();
        }
        minter = newMinter;
        emit NewMinter(newMinter);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Required function for UUPSUpgradeable to restrict upgraded to only owner.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        require(newImplementation != address(0), "Invalid address");
    }
}