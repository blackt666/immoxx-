import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getStageProgress, 
  getProbabilityClass, 
  validateProbability,
  CRM_STAGES,
  STAGE_ORDER
} from '../shared/constants/crm.constants';

describe('CRM Constants and Utilities', () => {
  describe('getStageProgress', () => {
    it('should return 0% for NEW stage', () => {
      expect(getStageProgress(CRM_STAGES.NEW)).toBe(0);
    });
    
    it('should return 100% for LOST stage', () => {
      expect(getStageProgress(CRM_STAGES.LOST)).toBe(100);
    });
    
    it('should return correct progress for middle stages', () => {
      expect(getStageProgress(CRM_STAGES.QUALIFIED)).toBeCloseTo(28.5, 0);
      expect(getStageProgress(CRM_STAGES.NEGOTIATION)).toBeCloseTo(57, 0);
    });
  });
  
  describe('validateProbability', () => {
    it('should clamp negative values to 0', () => {
      expect(validateProbability(-10)).toBe(0);
    });
    
    it('should clamp values over 100 to 100', () => {
      expect(validateProbability(150)).toBe(100);
    });
    
    it('should round decimal values', () => {
      expect(validateProbability(45.7)).toBe(46);
    });
  });
  
  describe('getProbabilityClass', () => {
    it('should return green for high probability', () => {
      expect(getProbabilityClass(85)).toContain('green');
    });
    
    it('should return yellow for medium probability', () => {
      expect(getProbabilityClass(65)).toContain('yellow');
    });
    
    it('should return red for low probability', () => {
      expect(getProbabilityClass(20)).toContain('red');
    });
  });
});
