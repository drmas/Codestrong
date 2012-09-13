(function(Model) {
	//dependencies
	var Cloud = require('ti.cloud');
	
	return Model.extend({
		//Authenticate a user against the Appcelerator Network and link to an ACS account
	    login: function(username, password, success, error) {
			var xhr = Ti.Network.createHTTPClient();
		
			//Parity issue: iOS fires onload for 4xx and 3xx status codes, so need to manually check onload
			xhr.onload = function() {
				Ti.API.info('Status Code: '+ xhr.status);
				Ti.API.info('Set-Cookie: '+ xhr.getResponseHeader('Set-Cookie'));
				Ti.API.info('responseText: '+ xhr.responseText);
				try {
					if (xhr.status == 200) {
						var sessionId = '',
							userDetails;
							
						if (this.responseText) {
							//throw in network details for later use
							Ti.App.Properties.setString('networkDetails', this.responseText);
							userDetails = JSON.parse(this.responseText);
							sessionId = userDetails.sid;
						}
						
						//Associate an Appcelerator developer login with an ACS account
						Cloud.SocialIntegrations.externalAccountLogin({
							id: userDetails.guid,
							type: 'appc',
				            token: sessionId
						}, function(e) {
							if (e.success) {
								//Store the current value of the Cloud session for later use, and notify app of success
								Ti.App.Properties.setString('sessionId', Cloud.sessionId);
								success(userDetails);
							}
							else {
								Ti.API.error('Social Integration Error: '+e);
								error(xhr);
							}
						});
					}
					else {
						Ti.API.error('Error code received from server: '+xhr);
						error(xhr);
					}
				}
				catch(e) {
					Ti.API.error('Exception processing response: '+e);
					error(xhr);
				}
			};
			
			xhr.onerror = function() {
				Ti.API.error('Login Request Error:');
				Ti.API.error('Status Code: '+ xhr.status);
				Ti.API.error('Set-Cookie: '+ xhr.getResponseHeader('Set-Cookie'));
				Ti.API.error('responseText: '+ xhr.responseText);
				error(xhr);
			};
			
			xhr.open('POST', 'https://api.appcelerator.net/p/v1/sso-login');
			xhr.send({
				un:username,
				pw:password,
				mid:Ti.Platform.id
			});
		},
		
		//Access user details, as returned from a successful 
		getUserDetails: function() {
			var deets;
			if (Ti.App.Properties.hasProperty('networkDetails')) {
				try {
					deets = JSON.parse(Ti.App.Properties.getString('networkDetails'));
				}
				catch (e) { 
					Ti.API.error('Error parsing user details: '+e);
					//swallow, if we barf on this we'll return falsy 
				}
			}
			return deets;
		}
	});
})