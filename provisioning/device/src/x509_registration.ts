// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
import { RegistrationClient, RegistrationRequest, RegistrationResult, DeviceRegistrationResult } from './interfaces';
import { X509ProvisioningTransport, X509SecurityClient } from './interfaces';
import { PollingStateMachine } from './polling_state_machine';
import * as dbg from 'debug';
import { Callback, callbackToPromise, ErrorCallback, errorCallbackToPromise } from 'azure-iot-common';

const debug = dbg('azure-iot-provisioning-device:X509Registration');

/**
 * Client used to run the registration of a device using X509 authentication.
 */
export class X509Registration implements RegistrationClient {

  private _transport: X509ProvisioningTransport;
  private _securityClient: X509SecurityClient;
  private _provisioningHost: string;
  private _idScope: string;
  private _pollingStateMachine: PollingStateMachine;

  constructor(provisioningHost: string, idScope: string, transport: X509ProvisioningTransport, securityClient: X509SecurityClient) {
    this._provisioningHost = provisioningHost;
    this._idScope = idScope;
    this._transport = transport;
    this._securityClient = securityClient;
    this._pollingStateMachine = new PollingStateMachine(this._transport);
  }

  /**
   * Register the device with the provisioning service.
   *
   * @param registrationId The registration Id for the device
   * @param forceRegistration Set to true to force re-registration
   * @param callback function called when registration is complete.
   */
  _register(callback: Callback<RegistrationResult>): void {

      /* Codes_SRS_NODE_DPS_X509_REGISTRATION_18_001: [ `register` shall call `getCertificate` on the security object to acquire the X509 certificate. ] */
      this._securityClient.getCertificate((err, cert)  => {
      if (err) {
        /* Codes_SRS_NODE_DPS_X509_REGISTRATION_18_006: [ If `getCertificate`fails, `register` shall call `callback` with the error ] */
        debug('security client returned error on cert acquisition');
        callback(err);
      } else {
        let registrationId: string = this._securityClient.getRegistrationId();
        let request: RegistrationRequest = {
          registrationId: registrationId,
          provisioningHost: this._provisioningHost,
          idScope: this._idScope
        };
        /* Codes_SRS_NODE_DPS_X509_REGISTRATION_18_004: [ `register` shall pass the certificate into the `setAuthentication` method on the transport ] */
        this._transport.setAuthentication(cert);
        /* Codes_SRS_NODE_DPS_X509_REGISTRATION_18_002: [ `register` shall call `registerX509` on the transport object and call it's callback with the result of the transport operation. ] */
        this._pollingStateMachine.register(request, (err?: Error, result?: DeviceRegistrationResult) => {
          this._pollingStateMachine.disconnect((disconnectErr: Error) => {
            if (disconnectErr) {
              debug('error disconnecting.  Ignoring.  ' + disconnectErr);
            }
            if (err) {
              /* Codes_SRS_NODE_DPS_X509_REGISTRATION_18_005: [ If `register` on the pollingStateMachine fails, `register` shall call `callback` with the error ] */
              callback(err);
            } else {
              callback(null, result.registrationState);
            }
          });
        });
      }
    });
  }

  register(callback?: Callback<RegistrationResult>): Promise<RegistrationResult> | void {
    if (callback) {
      return this._register(callback);
    }

    return callbackToPromise((_callback) => this._register(_callback));
  }

  /**
   * Cancels the current registration process.
   *
   * @param callback function called when the registration has already been canceled.
   */
  /* Codes_SRS_NODE_DPS_X509_REGISTRATION_18_003: [ `cancel` shall call `endSession` on the transport object. ] */
  _cancel(callback: ErrorCallback): void {
    this._transport.cancel(callback);
  }

  cancel(callback?: ErrorCallback): Promise<void> | void {
    if (callback) {
      return this._cancel(callback);
    }

    return errorCallbackToPromise((_callback) => this._cancel(_callback));
  }
}
