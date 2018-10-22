const crypto = require('crypto');

module.exports = (method, url) => {
    var params = {
        oauth_consumer_key: 'wCc48l3lahUSGg1e8cGS9yNXn',
        oauth_nonce: '',
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: '',
        oauth_version: '1.0'
    };

    const consumerSecret = encodeURIComponent('xdqQvqo4f3t3jo0wzZ46mUiPZY7i3y1lSLOkjvMqt0jT9i0qTh');
    //const authSecret = encodeURIComponent('6B90TpFAFJ9hIDPvyTQ53ybpWARNIoqakwhcu993PudpK');
    const authSecret = encodeURI('');

    params.oauth_timestamp = Math.floor(Date.now()/1000);

    const nonce = params.oauth_timestamp + '' + Math.floor(Math.random() / 1000) + 'zork_el';
    params.oauth_nonce = Buffer.from(nonce).toString('base64');

    var paramString = '';

    var p = Object.keys(params)
        .sort()
        .map((key) => {
            let encVal = encodeURIComponent(params[key]);
            return `${key}=${encVal}`;
        });   
    const generateParamString = p.join('&');
    
    p = [method, url, encodeURIComponent(generateParamString)];
    const generateBaseSignatureString = p.join('&');

    p = [consumerSecret, authSecret];
    const sigSigningKey = p.join('&');
    console.log(sigSigningKey);

    const signature = crypto.createHmac('sha1', sigSigningKey).update(generateBaseSignatureString).digest('base64');

    params.oauth_signature = signature;

    return params;
};