/**
 * Unit tests for the cryptographic service
 */

const sinon = require('sinon');
const { expect } = require('chai');
const cryptoService = require('../../../../services/crypto/crypto-service');
const kmsClient = require('../../../../utils/kms-client');

describe('Crypto Service', () => {
  let encryptStub, decryptStub, signStub, verifyStub;
  
  beforeEach(() => {
    // Create stubs for the KMS client methods
    encryptStub = sinon.stub(kmsClient, 'encrypt').resolves({
      ciphertext: 'encrypted-data-base64',
      keyVersion: '1'
    });
    
    decryptStub = sinon.stub(kmsClient, 'decrypt').resolves(
      Buffer.from('decrypted-data')
    );
    
    signStub = sinon.stub(kmsClient, 'sign').resolves({
      signature: 'signature-base64',
      keyVersion: '1'
    });
    
    verifyStub = sinon.stub(kmsClient, 'verify').resolves(true);
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('encryptData', () => {
    it('should encrypt data using KMS', async () => {
      const result = await cryptoService.encryptData('test-data');
      
      expect(encryptStub.calledOnce).to.be.true;
      expect(result).to.deep.equal({
        ciphertext: 'encrypted-data-base64',
        keyVersion: '1'
      });
    });
    
    it('should handle encryption errors', async () => {
      encryptStub.rejects(new Error('KMS encryption failed'));
      
      try {
        await cryptoService.encryptData('test-data');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to encrypt data');
      }
    });
  });
  
  describe('decryptData', () => {
    it('should decrypt data using KMS', async () => {
      const result = await cryptoService.decryptData('encrypted-data-base64', '1');
      
      expect(decryptStub.calledOnce).to.be.true;
      expect(result.toString()).to.equal('decrypted-data');
    });
    
    it('should handle decryption errors', async () => {
      decryptStub.rejects(new Error('KMS decryption failed'));
      
      try {
        await cryptoService.decryptData('encrypted-data-base64', '1');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to decrypt data');
      }
    });
  });
  
  describe('signData', () => {
    it('should sign data using KMS', async () => {
      const result = await cryptoService.signData('test-data');
      
      expect(signStub.calledOnce).to.be.true;
      expect(result).to.deep.equal({
        signature: 'signature-base64',
        keyVersion: '1'
      });
    });
    
    it('should handle signing errors', async () => {
      signStub.rejects(new Error('KMS signing failed'));
      
      try {
        await cryptoService.signData('test-data');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to sign data');
      }
    });
  });
  
  describe('verifySignature', () => {
    it('should verify signatures using KMS', async () => {
      const result = await cryptoService.verifySignature('signature-base64', 'test-data', '1');
      
      expect(verifyStub.calledOnce).to.be.true;
      expect(result).to.be.true;
    });
    
    it('should handle verification errors', async () => {
      verifyStub.rejects(new Error('KMS verification failed'));
      
      try {
        await cryptoService.verifySignature('signature-base64', 'test-data', '1');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to verify signature');
      }
    });
  });
  
  describe('encryptAndSign', () => {
    it('should encrypt and sign data', async () => {
      const result = await cryptoService.encryptAndSign('test-data');
      
      expect(encryptStub.calledOnce).to.be.true;
      expect(signStub.calledOnce).to.be.true;
      expect(result).to.deep.equal({
        ciphertext: 'encrypted-data-base64',
        signature: 'signature-base64',
        encKeyVersion: '1',
        signKeyVersion: '1'
      });
    });
    
    it('should handle JSON objects', async () => {
      const testObj = { name: 'test', value: 123 };
      await cryptoService.encryptAndSign(testObj);
      
      expect(encryptStub.calledOnce).to.be.true;
      const encryptedData = encryptStub.args[0][0];
      expect(typeof encryptedData).to.equal('string');
      expect(JSON.parse(encryptedData)).to.deep.equal(testObj);
    });
  });
  
  describe('verifyAndDecrypt', () => {
    it('should verify and decrypt data', async () => {
      const protectedData = {
        ciphertext: 'encrypted-data-base64',
        signature: 'signature-base64',
        encKeyVersion: '1',
        signKeyVersion: '1'
      };
      
      const result = await cryptoService.verifyAndDecrypt(protectedData);
      
      expect(verifyStub.calledOnce).to.be.true;
      expect(decryptStub.calledOnce).to.be.true;
      expect(result.toString()).to.equal('decrypted-data');
    });
    
    it('should parse JSON data when requested', async () => {
      decryptStub.resolves(Buffer.from('{"name":"test","value":123}'));
      
      const protectedData = {
        ciphertext: 'encrypted-data-base64',
        signature: 'signature-base64',
        encKeyVersion: '1',
        signKeyVersion: '1'
      };
      
      const result = await cryptoService.verifyAndDecrypt(protectedData, true);
      
      expect(result).to.deep.equal({ name: 'test', value: 123 });
    });
    
    it('should throw an error for invalid signatures', async () => {
      verifyStub.resolves(false);
      
      const protectedData = {
        ciphertext: 'encrypted-data-base64',
        signature: 'signature-base64',
        encKeyVersion: '1',
        signKeyVersion: '1'
      };
      
      try {
        await cryptoService.verifyAndDecrypt(protectedData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Invalid signature');
      }
    });
  });
});