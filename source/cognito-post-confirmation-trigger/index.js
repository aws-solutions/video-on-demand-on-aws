const AWS = require('aws-sdk');

exports.handler = async (event, _context, callback) => {
  const { userPoolId, userName } = event;

  try {
    await adminAddUserToGroup({
      userPoolId,
      username: userName,
      groupName: 'AppSyncReadOnly',
    });

    return callback(null, event);
  } catch (error) {
    return callback(error, event);
  }
};

const adminAddUserToGroup = ({ userPoolId, username, groupName }) => {
  const params = {
    GroupName: groupName,
    UserPoolId: userPoolId,
    Username: username,
  };

  const cognitoIdp = new AWS.CognitoIdentityServiceProvider();
  return cognitoIdp.adminAddUserToGroup(params).promise();
};
