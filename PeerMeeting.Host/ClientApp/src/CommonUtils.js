/* eslint-disable */
var CommonUtils = {
    getInitials: function (fullName) {
        if (!fullName) return "";
        var splited = fullName.split(" ");
        if (splited.length > 1) return splited[0][0] + splited[1][0];
        return splited[0][0];
      },
}
export default CommonUtils
