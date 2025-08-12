import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';

/**
 * ProfileHeader component displays the user's basic information and avatar
 */
const ProfileHeader = ({ 
  walletAddress, 
  network, 
  avatarUrl, 
  username, 
  joinDate, 
  isVerified 
}) => {
  // Generate initials from wallet address if no username is provided
  const getInitials = () => {
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return walletAddress && walletAddress.length >= 2 ? walletAddress.substring(0, 2).toUpperCase() : 'NA';
  };

  // Format wallet address for display (truncate middle)
  const formatWalletAddress = (address) => {
    // Early return with meaningful messages
    if (!address) return 'Not connected';
    if (typeof address !== 'string') return 'Invalid address';
    if (address.length < 10) return address; // Don't truncate short addresses
    
    // Use try-catch for extra safety
    try {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    } catch (error) {
      console.error('Error formatting wallet address:', error);
      return 'Address error';
    }
  };

  const handleEditProfile = () => {
    // Navigate to profile editing mode or modal
    alert('EDIT PROFILE: Feature coming soon! This would allow editing display name, bio, and settings.');
  };

  const handleShareProfile = () => {
    // Copy profile URL to clipboard or open share modal
    const profileUrl = `${window.location.origin}/profile`;
    navigator.clipboard.writeText(profileUrl)
      .then(() => {
        alert('Profile URL copied to clipboard!');
      })
      .catch(() => {
        alert('Profile URL: ' + profileUrl);
      });
  };

  return (
    <div className="profile-header card">
      <div className="profile-header-content">
        <div className="profile-avatar-container">
          {avatarUrl ? (
            <Image 
              src={avatarUrl} 
              alt="User avatar" 
              className="profile-avatar"
              width={64}
              height={64}
            />
          ) : (
            <div className="profile-avatar profile-avatar-placeholder">
              {getInitials()}
            </div>
          )}
          {isVerified && (
            <div className="profile-verified-badge" title="Verified User">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="profile-info">
          <h2 className="profile-username">
            {username || 'Anonymous User'}
          </h2>
          
          <div className="profile-wallet">
            <span className="profile-wallet-address" title={walletAddress}>
              {formatWalletAddress(walletAddress)}
            </span>
            <button 
              className="profile-copy-address" 
              onClick={() => {
                try {
                  if (walletAddress) {
                    navigator.clipboard.writeText(walletAddress)
                      .then(() => {
                        // Could show a success toast notification here
                        console.log('Wallet address copied to clipboard');
                      })
                      .catch(err => {
                        console.error('Failed to copy wallet address:', err);
                      });
                  } else {
                    console.warn('Cannot copy: wallet address is empty');
                  }
                } catch (error) {
                  console.error('Error copying wallet address:', error);
                }
              }}
              disabled={!walletAddress}
              aria-label="Copy wallet address"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
            </button>
          </div>
          
          <div className="profile-meta app-form-row-2">
            <div className="profile-network app-form-field">
              <span className="profile-meta-label">Network:</span>
              <span className="profile-meta-value">{network.name}</span>
            </div>
            
            <div className="profile-join-date app-form-field">
              <span className="profile-meta-label">Member since:</span>
              <span className="profile-meta-value">{joinDate}</span>
            </div>
          </div>
        </div>
        
        <div className="profile-actions">
          <button 
            className="button button-outline button-sm app-button-animate" 
            onClick={handleEditProfile}
          >
            Edit Profile
          </button>
          <button 
            className="button button-ghost button-sm app-button-animate" 
            onClick={handleShareProfile}
          >
            Share Profile
          </button>
        </div>
      </div>
    </div>
  );
};

ProfileHeader.propTypes = {
  walletAddress: PropTypes.string,
  network: PropTypes.shape({
    name: PropTypes.string
  }),
  avatarUrl: PropTypes.string,
  username: PropTypes.string,
  joinDate: PropTypes.string,
  isVerified: PropTypes.bool,
};

ProfileHeader.defaultProps = {
  walletAddress: '',
  network: { name: 'Unknown' },
  avatarUrl: '',
  username: '',
  joinDate: 'Unknown',
  isVerified: false,
};

export default ProfileHeader;
