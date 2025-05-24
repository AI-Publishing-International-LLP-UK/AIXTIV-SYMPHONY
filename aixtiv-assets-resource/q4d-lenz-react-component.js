import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import HockeyPuckIcon from './icons/HockeyPuckIcon';
import { colors } from './design-tokens';
import axios from 'axios';

/**
 * Q4D-Lenz Component
 *
 * This component provides the Q4D-Lenz functionality for the AIXTIV Symphony ecosystem.
 * It serves as an interface for the multi-dimensional analysis capabilities.
 *
 * @param {Object} props - Component properties
 * @returns {JSX.Element} - Rendered component
 */
export const Q4DLenzTool = props => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [lenzType, setLenzType] = useState('professional'); // Default to professional lens

  // Options for the Q4D-Lenz API
  const apiOptions = {
    baseURL: 'https://api-for-warp-drive.uc.r.appspot.com/q4d-lenz',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user?.token}`,
    },
  };

  /**
   * Initialize the Q4D-Lenz configuration based on user profile
   */
  useEffect(() => {
    if (user?.profile?.preferences?.lenzType) {
      setLenzType(user.profile.preferences.lenzType);
    }
  }, [user]);

  /**
   * Trigger the Q4D-Lenz analysis
   */
  const handleAnalysis = async () => {
    if (isAnalyzing) return;

    try {
      setIsAnalyzing(true);

      // Gather context data
      const contextData = {
        userId: user?.id,
        lenzType: lenzType,
        includeLinkedIn: true,
        includeProfessionalHistory: true,
        includeNetworkAnalysis: true,
      };

      // Call the Q4D-Lenz API
      const response = await axios.post('/analyze', contextData, apiOptions);

      // Process the results
      setResults(response.data);

      // Trigger the analysis completed callback if provided
      if (props.onAnalysisComplete) {
        props.onAnalysisComplete(response.data);
      }

      console.log('Q4D-Lenz analysis complete:', response.data);
    } catch (error) {
      console.error('Error in Q4D-Lenz analysis:', error);

      // Trigger the error callback if provided
      if (props.onAnalysisError) {
        props.onAnalysisError(error);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Change the type of lens being used
   * @param {string} type - Lens type ('personal', 'professional', or 'enterprise')
   */
  const changeLenzType = type => {
    setLenzType(type);

    // Save preference if authorized
    if (user?.id) {
      axios
        .post('/preferences', { lenzType: type }, apiOptions)
        .catch(err => console.error('Failed to save lens preference:', err));
    }
  };

  /**
   * Get the color for the current lens type
   * @returns {string} - Color value
   */
  const getLenzColor = () => {
    switch (lenzType) {
      case 'personal':
        return colors.special.personalLenz;
      case 'enterprise':
        return colors.special.enterpriseLenz;
      case 'professional':
      default:
        return colors.special.lenz;
    }
  };

  return (
    <div className="q4d-lenz-container">
      <HockeyPuckIcon
        label={`${lenzType} q4d-lenz`}
        color={getLenzColor()}
        onClick={handleAnalysis}
        isActive={isAnalyzing}
        isPermanent={true}
        tooltip={`Analyze with ${lenzType} perspective`}
        {...props}
      >
        {isAnalyzing ? (
          <span className="analyzing-indicator">⏳</span>
        ) : (
          <span className="lenz-icon">🔍</span>
        )}
      </HockeyPuckIcon>

      {props.showTypeSwitcher && (
        <div className="lenz-type-switcher">
          <button
            className={`lenz-type-button ${lenzType === 'personal' ? 'active' : ''}`}
            onClick={() => changeLenzType('personal')}
          >
            Personal
          </button>
          <button
            className={`lenz-type-button ${lenzType === 'professional' ? 'active' : ''}`}
            onClick={() => changeLenzType('professional')}
          >
            Professional
          </button>
          <button
            className={`lenz-type-button ${lenzType === 'enterprise' ? 'active' : ''}`}
            onClick={() => changeLenzType('enterprise')}
          >
            Enterprise
          </button>
        </div>
      )}

      {results && props.showResults && (
        <div className="lenz-results">
          <h3>Q4D-Lenz Analysis Results</h3>
          <div className="dimensions">
            <div className="dimension self">
              <h4>Self Dimension</h4>
              <p>{results.dimensions.self.summary}</p>
            </div>
            <div className="dimension social">
              <h4>Social Dimension</h4>
              <p>{results.dimensions.social.summary}</p>
            </div>
            <div className="dimension professional">
              <h4>Professional Dimension</h4>
              <p>{results.dimensions.professional.summary}</p>
            </div>
            {lenzType === 'enterprise' && (
              <div className="dimension enterprise">
                <h4>Enterprise Dimension</h4>
                <p>{results.dimensions.enterprise.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Default props
Q4DLenzTool.defaultProps = {
  showTypeSwitcher: false,
  showResults: false,
  onAnalysisComplete: null,
  onAnalysisError: null,
};

export default Q4DLenzTool;
