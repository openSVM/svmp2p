import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * ProfileSettings component allows users to customize their profile settings
 */
const ProfileSettings = ({ settings, onSaveSettings }) => {
  const [profileSettings, setProfileSettings] = useState(settings);
  const [isEditing, setIsEditing] = useState(false);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileSettings({
      ...profileSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(profileSettings);
    setIsEditing(false);
  };
  
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import PropertyValueTable from '../common/PropertyValueTable';

/**
 * ProfileSettings component allows users to customize their profile settings
 */
const ProfileSettings = ({ settings, onSaveSettings }) => {
  const [profileSettings, setProfileSettings] = useState(settings);
  const [isEditing, setIsEditing] = useState(false);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileSettings({
      ...profileSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(profileSettings);
    setIsEditing(false);
  };

  // Prepare display preferences data
  const displayPreferencesData = [
    { 
      property: 'DISPLAY NAME', 
      value: profileSettings.displayName || 'NOT SET',
      valueClassName: profileSettings.displayName ? 'has-value' : 'no-value'
    },
    { 
      property: 'BIO', 
      value: profileSettings.bio || 'NOT SET',
      valueClassName: profileSettings.bio ? 'has-value' : 'no-value',
      description: profileSettings.bio ? `${profileSettings.bio.length}/160 characters` : null
    },
    { 
      property: 'SHOW REPUTATION SCORE', 
      value: profileSettings.showReputationScore ? 'YES' : 'NO',
      badge: profileSettings.showReputationScore ? 'ENABLED' : 'DISABLED',
      badgeClassName: profileSettings.showReputationScore ? 'badge-success' : 'badge-neutral'
    },
    { 
      property: 'SHOW TRANSACTION HISTORY', 
      value: profileSettings.showTransactionHistory ? 'YES' : 'NO',
      badge: profileSettings.showTransactionHistory ? 'ENABLED' : 'DISABLED',
      badgeClassName: profileSettings.showTransactionHistory ? 'badge-success' : 'badge-neutral'
    },
  ];

  // Prepare notification settings data
  const notificationSettingsData = [
    { 
      property: 'EMAIL NOTIFICATIONS', 
      value: profileSettings.emailNotifications ? 'ENABLED' : 'DISABLED',
      badge: profileSettings.emailNotifications ? 'ON' : 'OFF',
      badgeClassName: profileSettings.emailNotifications ? 'badge-success' : 'badge-neutral'
    },
    { 
      property: 'BROWSER NOTIFICATIONS', 
      value: profileSettings.browserNotifications ? 'ENABLED' : 'DISABLED',
      badge: profileSettings.browserNotifications ? 'ON' : 'OFF',
      badgeClassName: profileSettings.browserNotifications ? 'badge-success' : 'badge-neutral'
    },
    { 
      property: 'NOTIFICATION FREQUENCY', 
      value: profileSettings.notificationFrequency === 'immediate' ? 'IMMEDIATE' :
             profileSettings.notificationFrequency === 'hourly' ? 'HOURLY DIGEST' :
             profileSettings.notificationFrequency === 'daily' ? 'DAILY DIGEST' :
             'WEEKLY DIGEST'
    },
  ];

  // Prepare privacy settings data
  const privacySettingsData = [
    { 
      property: 'PRIVATE PROFILE', 
      value: profileSettings.privateProfile ? 'YES' : 'NO',
      badge: profileSettings.privateProfile ? 'PRIVATE' : 'PUBLIC',
      badgeClassName: profileSettings.privateProfile ? 'badge-warning' : 'badge-success',
      description: profileSettings.privateProfile ? 'Only users you\'ve traded with can see your profile' : null
    },
    { 
      property: 'HIDE WALLET ADDRESS', 
      value: profileSettings.hideWalletAddress ? 'YES' : 'NO',
      badge: profileSettings.hideWalletAddress ? 'HIDDEN' : 'VISIBLE',
      badgeClassName: profileSettings.hideWalletAddress ? 'badge-warning' : 'badge-neutral'
    },
  ];

  const settingsActions = (
    <div className="settings-actions">
      {!isEditing ? (
        <button 
          className="button button-outline button-sm"
          onClick={() => setIsEditing(true)}
        >
          EDIT SETTINGS
        </button>
      ) : (
        <div className="edit-actions">
          <button 
            className="button button-primary button-sm"
            onClick={handleSubmit}
          >
            SAVE CHANGES
          </button>
          <button 
            className="button button-secondary button-sm"
            onClick={() => {
              setProfileSettings(settings);
              setIsEditing(false);
            }}
          >
            CANCEL
          </button>
        </div>
      )}
    </div>
  );

  if (isEditing) {
    return (
      <div className="profile-settings-edit">
        <div className="ascii-form">
          <div className="ascii-form-header">EDIT PROFILE SETTINGS</div>
          
          <form onSubmit={handleSubmit}>
            <div className="ascii-form-section">
              <div className="ascii-form-section-title">DISPLAY PREFERENCES</div>
              
              <div className="ascii-form-row-2">
                <div className="ascii-field">
                  <label htmlFor="displayName">DISPLAY NAME</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={profileSettings.displayName}
                    onChange={handleChange}
                    placeholder="Enter display name"
                    maxLength={30}
                  />
                  <div className="ascii-field-help">This name will be displayed to other users</div>
                </div>
                
                <div className="ascii-field">
                  <label htmlFor="bio">BIO</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileSettings.bio}
                    onChange={handleChange}
                    placeholder="Tell others about yourself"
                    maxLength={160}
                    rows={3}
                  />
                  <div className="ascii-field-help">
                    {160 - (profileSettings.bio?.length || 0)} characters remaining
                  </div>
                </div>
              </div>
              
              <div className="ascii-form-row-2">
                <div className="ascii-field-inline">
                  <label className="ascii-checkbox">
                    <input
                      type="checkbox"
                      name="showReputationScore"
                      checked={profileSettings.showReputationScore}
                      onChange={handleChange}
                    />
                    SHOW REPUTATION SCORE PUBLICLY
                  </label>
                </div>
                
                <div className="ascii-field-inline">
                  <label className="ascii-checkbox">
                    <input
                      type="checkbox"
                      name="showTransactionHistory"
                      checked={profileSettings.showTransactionHistory}
                      onChange={handleChange}
                    />
                    SHOW TRANSACTION HISTORY PUBLICLY
                  </label>
                </div>
              </div>
            </div>
            
            <div className="ascii-form-section">
              <div className="ascii-form-section-title">NOTIFICATION SETTINGS</div>
              
              <div className="ascii-form-row-3">
                <div className="ascii-field-inline">
                  <label className="ascii-checkbox">
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={profileSettings.emailNotifications}
                      onChange={handleChange}
                    />
                    EMAIL NOTIFICATIONS
                  </label>
                </div>
                
                <div className="ascii-field-inline">
                  <label className="ascii-checkbox">
                    <input
                      type="checkbox"
                      name="browserNotifications"
                      checked={profileSettings.browserNotifications}
                      onChange={handleChange}
                    />
                    BROWSER NOTIFICATIONS
                  </label>
                </div>
                
                <div className="ascii-field">
                  <label htmlFor="notificationFrequency">FREQUENCY</label>
                  <select
                    id="notificationFrequency"
                    name="notificationFrequency"
                    value={profileSettings.notificationFrequency}
                    onChange={handleChange}
                  >
                    <option value="immediate">Immediate</option>
                    <option value="hourly">Hourly Digest</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Digest</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="ascii-form-section">
              <div className="ascii-form-section-title">PRIVACY SETTINGS</div>
              
              <div className="ascii-form-row-2">
                <div className="ascii-field-inline">
                  <label className="ascii-checkbox">
                    <input
                      type="checkbox"
                      name="privateProfile"
                      checked={profileSettings.privateProfile}
                      onChange={handleChange}
                    />
                    MAKE PROFILE PRIVATE
                  </label>
                  <div className="ascii-field-help">
                    Only users you've traded with can see your profile
                  </div>
                </div>
                
                <div className="ascii-field-inline">
                  <label className="ascii-checkbox">
                    <input
                      type="checkbox"
                      name="hideWalletAddress"
                      checked={profileSettings.hideWalletAddress}
                      onChange={handleChange}
                    />
                    HIDE FULL WALLET ADDRESS
                  </label>
                </div>
              </div>
            </div>
            
            <div className="ascii-form-actions">
              <button type="submit" className="ascii-button-primary">
                SAVE SETTINGS
              </button>
              <button 
                type="button" 
                className="ascii-button-secondary"
                onClick={() => {
                  setProfileSettings(settings);
                  setIsEditing(false);
                }}
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-settings">
      <PropertyValueTable
        title="Display Preferences"
        data={displayPreferencesData}
        className="display-preferences-table"
      />
      
      <PropertyValueTable
        title="Notification Settings"
        data={notificationSettingsData}
        className="notification-settings-table"
      />
      
      <PropertyValueTable
        title="Privacy Settings"
        data={privacySettingsData}
        actions={settingsActions}
        className="privacy-settings-table"
      />
    </div>
  );
};

ProfileSettings.propTypes = {
  settings: PropTypes.shape({
    displayName: PropTypes.string,
    bio: PropTypes.string,
    showReputationScore: PropTypes.bool,
    showTransactionHistory: PropTypes.bool,
    emailNotifications: PropTypes.bool,
    browserNotifications: PropTypes.bool,
    notificationFrequency: PropTypes.string,
    privateProfile: PropTypes.bool,
    hideWalletAddress: PropTypes.bool,
  }),
  onSaveSettings: PropTypes.func.isRequired,
};

ProfileSettings.defaultProps = {
  settings: {
    displayName: '',
    bio: '',
    showReputationScore: true,
    showTransactionHistory: false,
    emailNotifications: true,
    browserNotifications: true,
    notificationFrequency: 'immediate',
    privateProfile: false,
    hideWalletAddress: false,
  },
};

export default ProfileSettings;
