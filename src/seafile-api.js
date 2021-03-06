var axios = require('axios');
var FormData = require('form-data');

class SeafileAPI {

  init({ server, username, password, token }) {
    this.server = server;
    this.username = username;
    this.password = password;
    this.token = token;  //none
    if (this.token && this.server) {
      this.req = axios.create({
        baseURL: this.server,
        headers: { 'Authorization': 'Token ' + this.token }
      });
    }
    return this;
  }

  initForSeahubUsage({ siteRoot, xcsrfHeaders }) {
    if (siteRoot && siteRoot.charAt(siteRoot.length-1) === "/") {
      var server = siteRoot.substring(0, siteRoot.length-1);
      this.server = server;
    } else {
      this.server = siteRoot;
    }

    this.req = axios.create({
      headers: {
        'X-CSRFToken': xcsrfHeaders,
      }
    });
    return this;
  }

  _sendPostRequest(url, form) {
    if (form.getHeaders) {
      return this.req.post(url, form, {
        headers:form.getHeaders()
      });
    } else {
      return this.req.post(url, form);
    }
  }

  getToken() {
    const url = this.server + '/api2/auth-token/';
    axios.post(url, {
      username: this.username,
      password: this.password
    }).then((response) => {
      this.token = response.data;
      return this.token;
    })
  }

  /**
   * Login to server and create axios instance for future usage
   */
  login() {
    const url = this.server + '/api2/auth-token/';
    return axios.post(url, {
      username: this.username,
      password: this.password
    }).then((response) => {
      this.token = response.data.token;
      this.req = axios.create({
        baseURL: this.server,
        headers: { 'Authorization': 'Token ' + this.token }
      });
    })
  }

  authPing() {
    const url = this.server + '/api2/auth/ping/';
    return this.req.get(url);
  }

  //---- Account API

  getAccountInfo() {
    const url =  this.server + '/api2/account/info/';
    return this.req.get(url);
  }
  
  //---- Group operation
  listGroups(withRepos = false) {
    let options = {with_repos: withRepos ? 1 : 0};
    const url = this.server + '/api/v2.1/groups/';
    return this.req.get(url, {params: options});
  }

  listGroupRepos(groupID) {
    const url = this.server + '/api/v2.1/groups/' + groupID + '/libraries/';
    return this.req.get(url);
  }


  getGroup(groupID) {
    const url = this.server + '/api/v2.1/groups/' + groupID + '/';
    return this.req.get(url);
  }

  createGroup(name) {
    const url = this.server + '/api/v2.1/groups/';
    let form = new FormData();
    form.append('name', name);
    return this._sendPostRequest(url, form);
  }

  renameGroup(groupID, name) {
    const url = this.server + '/api/v2.1/groups/' + groupID + '/';
    const params = {
      name: name
    }
    return this.req.put(url, params);
  }
  
  deleteGroup(groupID) {
    const url = this.server + '/api/v2.1/groups/' + groupID + '/';
    return this.req.delete(url);
  }

  transferGroup(groupID, ownerName) {
    const url = this.server + '/api/v2.1/groups/' + groupID + '/';
    const params = {
      owner: ownerName
    }
    return this.req.put(url, params);
  }

  quitGroup(groupID, userName) {
    const name = encodeURIComponent(userName);
    const url = this.server + '/api/v2.1/groups/' + groupID + '/members/' + name + '/';
    return this.req.delete(url);
  }

  listGroupMembers(groupID, isAdmin=false, avatarSize=64) {
    let url = this.server + '/api/v2.1/groups/' + groupID + '/members/?avatar_size=' + avatarSize + '&is_admin=' + isAdmin;
    return this.req.get(url);
  }

  addGroupMember(groupID, userName) {
    const url = this.server + '/api/v2.1/groups/' + groupID + '/members/';
    const params = {
      email: userName
    }
    return this.req.post(url, params);
  }

  addGroupMembers(groupID, userNames) {
    const url = this.server + '/api/v2.1/groups/' + groupID + '/members/bulk/';
    let form = new FormData();
    form.append('emails', userNames.join(','));
    return this._sendPostRequest(url, form);
  }

  deleteGroupMember(groupID, userName) {
    const name = encodeURIComponent(userName);
    const url = this.server + '/api/v2.1/groups/' + groupID + '/members/' + name + '/';
    return this.req.delete(url);
  }

  setGroupAdmin(groupID, userName, isAdmin) {
    let name = encodeURIComponent(userName);
    let url = this.server + '/api/v2.1/groups/' + groupID + '/members/' + name + '/';
    const params = {
      is_admin: isAdmin
    }
    return this.req.put(url, params);
  }

  createGroupOwnedLibrary(groupID, repo) {
    let repoName = repo.repo_name;
    let permission = repo.permission ? permission : 'rw';
    const url = this.server + '/api/v2.1/groups/'+ groupID + '/group-owned-libraries/';
    let form = new FormData();
    form.append('name', repoName);  // need to modify endpoint api;
    form.append('permission', permission);
    return this._sendPostRequest(url, form);
  }
  
  deleteGroupOwnedLibrary(groupID, repoID) {
    const url = this.server + '/api/v2.1/groups/'+ groupID + '/group-owned-libraries/' + repoID+ '/';
    return this.req.delete(url);
  }
  
  shareGroupOwnedRepoToUser(repoID, permission, username) {
    const url = this.server + '/api/v2.1/group-owned-libraries/' + repoID + '/user-share/'
    let form = new FormData();
    form.append('permission', permission);
    if (Array.isArray(username)) {
      username.forEach(item => {
        form.append('username', item);
      });
    } else {
      form.append('username', username);
    }
    return this._sendPostRequest(url, form);
  }

  modifyGroupOwnedRepoUserSharedPermission(repoID, permission, username) { //need check
    const url = this.server + '/api/v2.1/group-owned-libraries/' + repoID + '/user-share/'
    let form = new FormData();
    form.append('permission', permission);
    form.append('username', username);
    return this.req.put(url, form);
  }

  deleteGroupOwnedRepoSharedUserItem(repoID, username) {
    const url = this.server + '/api/v2.1/group-owned-libraries/' + repoID + '/user-share/'
    let params = {username: username};
    return this.req.delete(url, {data: params});
  }

  shareGroupOwnedRepoToGroup(repoID, permission, groupID) {
    const url = this.server + '/api/v2.1/group-owned-libraries/' + repoID + '/group-share/'
    let form = new FormData();
    form.append('permission', permission);
    if (Array.isArray(groupID)) {
      groupID.forEach(item => {
        form.append('group_id', item);
      });
    } else {
      form.append('group_id', groupID);
    }
    return this._sendPostRequest(url, form);
  }

  modifyGroupOwnedRepoGroupSharedPermission(repoID, permission, groupID) { //need check
    const url = this.server + '/api/v2.1/group-owned-libraries/' + repoID + '/group-share/'
    let form = new FormData();
    form.append('permission', permission);
    form.append('group_id', groupID);
    return this.req.put(url, form);
  }

  deleteGroupOwnedRepoSharedGroupItem(repoID, groupID) {
    const url = this.server + '/api/v2.1/group-owned-libraries/' + repoID + '/group-share/'
    let params = {group_id: groupID};
    return this.req.delete(url, {data: params});
  }

  //---- share operation

  // share-link
  listShareLinks() {
    const url = this.server + '/api/v2.1/share-links/';
    return this.req.get(url);
  }

  listAllShareLinks() {
    const url = this.server + '/api/v2.1/share-links/';
    return this.req.get(url);
  }

  listRepoShareLinks(repoID) {
    const url = this.server + '/api/v2.1/share-links/?repo_id=' + repoID;
    return this.req.get(url);
  }

  getShareLink(repoID, filePath) { //list folder(file) links
    const path = encodeURIComponent(filePath);
    const url = this.server + '/api/v2.1/share-links/?repo_id=' + repoID + '&path=' + path;
    return this.req.get(url);
  }

  createShareLink(repoID, path, password, expireDays, permissions) {
    const url = this.server + '/api/v2.1/share-links/';
    let form = new FormData();
    form.append('path', path);
    form.append('repo_id', repoID);
    form.append('permissions', permissions);
    if (password) {
      form.append('password', password);
    }
    if (expireDays) {
      form.append('expire_days', expireDays);
    }
    return this._sendPostRequest(url, form);
  }

  deleteShareLink(token) {
    const url = this.server + '/api/v2.1/share-links/' + token + '/';
    return this.req.delete(url);
  }

  listSharedRepos() {
    const url = this.server + '/api/v2.1/shared-repos/';
    return this.req.get(url);
  }

  // todo send email

  // upload-link
  listUploadLinks() {
    const url = this.server + '/api/v2.1/upload-links/';
    return this.req.get(url);
  }

  getUploadLinks(repoID, path) {
    const url = this.server + '/api/v2.1/upload-links/?repo_id=' + repoID + '&path=' + path;
    return this.req.get(url);
  }

  createUploadLink(repoID, path, password) {
    const url = this.server + '/api/v2.1/upload-links/';
    let form = new FormData();
    form.append('path', path);
    form.append('repo_id', repoID);
    if (password) {
      form.append('password', password);
    }
    return this._sendPostRequest(url, form);
  }

  deleteUploadLink(token) {
    const url = this.server + '/api/v2.1/upload-links/' + token + '/';
    return this.req.delete(url);
  }

  // todo send upload link email

  // shared-libraries
  listSharedItems(repoID, path, shareType) { // shareType: user, group
    path = encodeURIComponent(path);
    const url = this.server + '/api2/repos/' + repoID + '/dir/shared_items/?p=' + path + '&share_type=' + shareType;
    return this.req.get(url);
  }

  getBeSharedRepos() { //listBeSharedRepos
    const url = this.server + '/api2/beshared-repos/';
    return this.req.get(url);
  }

  leaveShareRepo(repoID, options) { // deleteBeSharedRepo
    const url = this.server + '/api2/beshared-repos/' + repoID + '/';
    return this.req.delete(url, {params: options});
  }

  // share repo to user is same to share Folder

  // unshare repo to user is same to unshare Folder

  deleteShareToUserItem(repoID, path, shareType, username) {
    path = encodeURIComponent(path);
    const url = this.server + '/api2/repos/' + repoID + '/dir/shared_items/?p=' + path + '&share_type=' + shareType + '&username=' + username;
    return this.req.delete(url); 
  }

  updateShareToUserItemPermission(repoID, path, shareType, username, permission) {
    path = encodeURIComponent(path);
    const url = this.server + '/api2/repos/' + repoID + '/dir/shared_items/?p=' + path + '&share_type=' + shareType + '&username=' + username;
    let form = new FormData();
    form.append('permission', permission);
    return this._sendPostRequest(url, form);
  }

  // share repo to group is same to share folder

  // unshare repo to group is same to unshare folder

  deleteShareToGroupItem(repoID, path, shareType, groupID) {
    path = encodeURIComponent(path);
    const url = this.server + '/api2/repos/' + repoID + '/dir/shared_items/?p=' + path + '&share_type=' + shareType + '&group_id=' + groupID;
    return this.req.delete(url);
  }
  
  updateShareToGroupItemPermission(repoID, path, shareType, groupID, permission) {
    path = encodeURIComponent(path);
    const url = this.server + '/api2/repos/' + repoID + '/dir/shared_items/?p=' + path + '&share_type=' + shareType + '&group_id=' + groupID;
    let form = new FormData();
    form.append('permission', permission);
    return this._sendPostRequest(url, form);
  }

  leaveShareGroupOwnedRepo(repoID) {
    const url = this.server + '/api/v2.1/group-owned-libraries/user-share-in-libraries/' + repoID + '/';
    return this.req.delete(url);
  }

  shareableGroups() {
    const url = this.server + '/api/v2.1/shareable-groups/';
    return this.req.get(url);
  }

  getSharedRepos() { 
    const url = this.server + '/api2/shared-repos/';
    return this.req.get(url);
  }

  updateRepoSharePerm(repoID, options) {
    const url = this.server + '/api/v2.1/shared-repos/' + repoID + '/';
    return this.req.put(url, options);
  }

  unshareRepo(repoID, options) {
    const url = this.server + '/api/v2.1/shared-repos/' + repoID + '/';
    return this.req.delete(url, {params: options});
  }

  // shared folders
  shareFolder(repoID, path, shareType, permission, paramArray) { // shareType: user group
    path = encodeURIComponent(path);
    var form = new FormData();
    form.append('share_type', shareType);
    form.append('permission', permission);
    if (shareType == 'user') {
      for (let i = 0; i < paramArray.length; i++) {
        form.append('username', paramArray[i]);
      }
    } else {
      for (let i = 0; i < paramArray.length; i++) {
        form.append('group_id', paramArray[i]);
      }
    }
    const url = this.server + '/api2/repos/' + repoID + '/dir/shared_items/?p=' + path;
    return this.req.put(url, form); 
  }

  listSharedFolders() {
    const url = this.server + '/api/v2.1/shared-folders/';
    return this.req.get(url);
  }

  updateFolderSharePerm(repoID, data, options) {
    const url = this.server + '/api2/repos/' + repoID + '/dir/shared_items/';
    return this.req.post(url, data, {params: options}); // due to the old api, use 'post' here
  }

  unshareFolder(repoID, options) {
    const url = this.server + '/api2/repos/' + repoID + '/dir/shared_items/';
    return this.req.delete(url, {params: options});
  }

  //---- repo(library) operation 
  createMineRepo(repo) {
    const url = this.server + '/api2/repos/?from=web';
    return this.req.post(url, repo);
  }
  
  createGroupRepo(groupID, repo) {
    const url = this.server + '/api/v2.1/groups/'+ groupID + '/libraries/';
    let form = new FormData();
    form.append("repo_name", repo.repo_name);
    if (repo.password) {
      form.append("password", repo.password);
    }
    form.append("permission", repo.permission);
    return this._sendPostRequest(url, form);
  }

  listRepos(options) {
    /*
     * options: `{type: 'shared'}`, `{type: ['mine', 'shared', ...]}`
     */
    let url = this.server + '/api/v2.1/repos/';

    if (!options) {
      // fetch all types of repos
      return this.req.get(url);
    }

    return this.req.get(url, {
      params: options,
      paramsSerializer: function(params) {
        let list = [];
        for (let key in params) {
          if (Array.isArray(params[key])) {
            for (let i = 0, len = params[key].length; i < len; i++) {
              list.push(key + '=' + encodeURIComponent(params[key][i]));
            }
          } else {
            list.push(key + '=' + encodeURIComponent(params[key]));
          }
        }
        return list.join('&');
      }
    });
  }
  
  getRepoInfo(repoID) {
    const url = this.server + '/api/v2.1/repos/' + repoID + '/';
    return this.req.get(url);
  }

  getRepoHistoryLimit(repoID) {
    const url = this.server + '/api2/repos/' + repoID + '/history-limit/';
    return this.req.get(url);
  }

  setRepoHistoryLimit(repoID, historyDays) {
    const url = this.server + '/api2/repos/' + repoID + '/history-limit/';
    let form = new FormData();
    form.append('keep_days', historyDays);
    return this.req.put(url, form);
  }
  
  deleteRepo(repoID) {
    const url = this.server + '/api/v2.1/repos/' + repoID + '/';
    return this.req.delete(url);
  }

  renameRepo(repoID, newName) {
    const url = this.server + '/api2/repos/' + repoID + '/?op=rename';
    let form = new FormData();
    form.append('repo_name', newName);
    return this._sendPostRequest(url, form);
  }

  transferRepo(repoID, owner) {
    const url = this.server + '/api2/repos/' + repoID + '/owner/';
    let form = new FormData();
    form.append('owner', owner);
    return this.req.put(url, form);
  }

  setRepoDecryptPassword(repoID, password) {
    const url = this.server + '/api/v2.1/repos/' + repoID + '/set-password/';
    let form = new FormData();
    form.append('password', password);
    return this._sendPostRequest(url, form);
  }

  createPublicRepo(repo) {
    const url = this.server + '/api2/repos/public/';
    return this.req.post(url, repo);
  }

  selectOwnedRepoToPublic(repoID, options) { // todo change a exist repo to public
    const url = this.server + '/api/v2.1/shared-repos/' + repoID + '/';
    return this.req.put(url, options);
  }

  // remove public repo is same to unshareRepo;

  getSource() {   // for search
    let CancelToken = axios.CancelToken;
    let source = CancelToken.source();
    return source;
  }

  searchFiles(searchParams, cancelToken) {
    const url = this.server + '/api2/search/';
    return this.req.get(url, {params: searchParams, cancelToken : cancelToken});
  }

  //admin 
  listDeletedRepo() {
    const url = this.server + '/api/v2.1/deleted-repos/';
    return this.req.get(url);
  }

  restoreDeletedRepo(repoID) {
    const url = this.server + '/api/v2.1/deleted-repos/';
    let form = new FormData();
    form.append('repo_id', repoID);
    return this._sendPostRequest(url, form);
  }

  //---- directory operation
  listDir(repoID, dirPath, { recursive = false, type = '', with_thumbnail = false, with_parents = false } = {}) {
    /*
     * opts: `{recursive: true}`, `{'with_thumbnail': true}`
     */
    const url = this.server + '/api/v2.1/repos/' + repoID + '/dir/';
    let params = {};
    params.p = dirPath;
    if (recursive) {
      params.recursive = recursive ? 1 : 0;
    }
    if (type) {
      params.t = type;
    }
    if (with_thumbnail) {
      params.with_thumbnail = with_thumbnail;
    }
    if (with_parents) {
      params.with_parents = with_parents;
    }
    return this.req.get(url, {params: params});
  }

  listWikiDir(slug, dirPath, withParents) {
    const path = encodeURIComponent(dirPath);
    let url = this.server + '/api/v2.1/wikis/' + slug + '/dir/?p=' + path;
    if (withParents) {
      url = this.server + '/api/v2.1/wikis/' + slug + '/dir/?p=' + path + '&with_parents=' + withParents;
    }
    return this.req.get(url);
  }

  getDirInfo(repoID, dirPath) {
    const path = encodeURIComponent(dirPath);
    const url = this.server + '/api/v2.1/repos/' + repoID + '/dir/detail/?path=' + path;
    return this.req.get(url);
  }

  createDir(repoID, dirPath) {
    const path = encodeURIComponent(dirPath);
    const url =  this.server + '/api2/repos/' + repoID + '/dir/?p=' + path;
    let form = new FormData();
    form.append('operation', 'mkdir');
    return this._sendPostRequest(url, form);
  }

  renameDir(repoID, dirPath, newdirName) {
    const path = encodeURIComponent(dirPath);
    const url = this.server + '/api2/repos/' + repoID + '/dir/?p=' + path;
    let form = new FormData();
    form.append("operation", 'rename');
    form.append("newname", newdirName);
    return this._sendPostRequest(url, form);
  }

  deleteDir(repoID, dirPath) {
    const path = encodeURIComponent(dirPath);
    const url = this.server + '/api2/repos/' +  repoID + '/dir/?p=' + path;
    return this.req.delete(url);
  }

  //---- multiple(File&Folder) operation
  copyDir(repoID, dstrepoID, dstfilePath, dirPath, direntNames) {
    let fileNames = direntNames;
    if (Array.isArray(direntNames)) {
      fileNames = '';
      for (let i = 0; i < direntNames.length; i++) {
        if (i < direntNames.length - 1) {
          fileNames += direntNames[i] + ':';
        } else {
          fileNames += direntNames[i];
        }
      }
    }
    const path = encodeURIComponent(dirPath);
    const url = this.server + '/api2/repos/' + repoID + '/fileops/copy/?p=' + path;
    let form = new FormData();
    form.append('dst_repo', dstrepoID);
    form.append('dst_dir', dstfilePath);
    form.append('file_names', fileNames);
    return this._sendPostRequest(url, form);
  }
  
  moveDir(repoID, dstrepoID, dstfilePath, dirPath, direntNames) {
    let fileNames = direntNames;
    if (Array.isArray(direntNames)) {
      fileNames = '';
      for (let i = 0; i < direntNames.length; i++) {
        if (i < direntNames.length - 1) {
          fileNames += direntNames[i] + ':';
        } else {
          fileNames += direntNames[i];
        }
      }
    }
    const path = encodeURIComponent(dirPath);
    const url = this.server + '/api2/repos/' + repoID + '/fileops/move/?p=' + path;
    let form = new FormData();
    form.append('dst_repo', dstrepoID);
    form.append('dst_dir', dstfilePath);
    form.append('file_names', fileNames);
    return this._sendPostRequest(url, form);
  }

  deleteMutipleDirents(repoID, parentDir, direntNames) {
    let fileNames = '';
    for (let i = 0; i < direntNames.length; i++) {
      if (i < direntNames.length - 1) {
        fileNames += direntNames[i] + ':';
      } else {
        fileNames += direntNames[i];
      }
    }
    const path = encodeURIComponent(parentDir);
    const url = this.server + '/api2/repos/' + repoID + '/fileops/delete/?p=' + path;
    let form = new FormData();
    form.append('file_names', fileNames);
    return this._sendPostRequest(url, form);
  }

  zipDownload(repoID, parent_dir, dirents) { // can download one dir
    let url = '';
    if (Array.isArray(dirents)) {
      let params = '';
      for (let i = 0; i < dirents.length; i++) {
        params += '&dirents=' + dirents[i];
      }
      url = this.server + '/api/v2.1/repos/' + repoID + '/zip-task/?parent_dir=' + parent_dir + params;
    } else {
      url = this.server + '/api/v2.1/repos/' + repoID + '/zip-task/?parent_dir=' + parent_dir + '&dirents=' + dirents;
    }
    return this.req.get(url);
  }

  queryZipProgress(zip_token) {
    const url = this.server  + '/api/v2.1/query-zip-progress/?token=' + zip_token;
    return this.req.get(url);
  }

  cancelZipTask(zip_token) {
    const url = this.server + '/api/v2.1/cancel-zip-task/';
    const form = new FormData();
    form.append("token", zip_token);
    return this.req.post(url, form);
  }

  //---- File Operation
  getFileInfo(repoID, filePath) {
    const path = encodeURIComponent(filePath);
    const url = this.server + '/api2/repos/' + repoID + '/file/detail/?p=' + path;
    return this.req.get(url);
  }

  getFileHistory(repoID, folderPath) {
    const url = this.server + "/api2/repos/" + repoID + "/file/history/?p=" + folderPath;
    return this.req.get(url);
  }

  getFileDownloadLink(repoID, filePath) {
    // reuse default to 1 to eliminate cross domain request problem
    //   In browser, the browser will send an option request to server first, the access Token
    //   will become invalid if reuse=0
    const path = encodeURIComponent(filePath);
    const url = this.server + '/api2/repos/' + repoID + '/file/?p=' + path + '&reuse=1';
    return this.req.get(url);
  }

  getFileContent(downloadLink) {
    return axios.create().get(downloadLink);
  }

  createFile(repoID, filePath, isDraft) {
    const path = encodeURIComponent(filePath);
    const url = this.server + '/api/v2.1/repos/' + repoID + '/file/?p=' + path;
    let form = new FormData();
    form.append('operation', 'create');
    form.append('is_draft', isDraft);
    return this._sendPostRequest(url, form);
  }

  renameFile(repoID, filePath, newfileName) {
    const path = encodeURIComponent(filePath);
    const url = this.server + '/api/v2.1/repos/' + repoID + '/file/?p=' + path;
    let form = new FormData();
    form.append('operation', 'rename');
    form.append('newname', newfileName);
    return this._sendPostRequest(url, form);
  }

  lockfile(repoID, filePath) {
    const url = this.server + '/api2/repos/'+ repoID + '/file/'
    let params = {p: filePath, operation: 'lock'};
    return this.req.put(url, params);
  }

  unlockfile(repoID, filePath) {
    const url = this.server + '/api2/repos/'+ repoID + '/file/'
    let params = {p: filePath, operation: 'unlock'};
    return this.req.put(url, params);
  }

  // move need to add

  // copy need to add

  revertFile(repoID, path, commitID) {
    const url = this.server +  '/api/v2.1/repos/'+ repoID + '/file/?p=' + path;
    let form = new FormData();
    form.append("operation", 'revert');
    form.append("commit_id", commitID);
    return this._sendPostRequest(url, form);
  }

  deleteFile(repoID, filePath) {
    const path = encodeURIComponent(filePath);
    const url = this.server + '/api2/repos/' + repoID + '/file/?p=' + path;
    return this.req.delete(url);
  }

  getUploadLink(repoID, folderPath) {
    const url = this.server + '/api2/repos/' + repoID + '/upload-link/?p=' + folderPath + '&from=web';
    return this.req.get(url);
  }

  getFileUploadedBytes(repoID, filePath, fileName) {
    let url = this.server + '/api/v2.1/repos/' + repoID + '/file-uploaded-bytes/';
    let params = {
      parent_dir: filePath,
      file_name: fileName,
    };
    return this.req.get(url, {params: params});
  }

  uploadImage (uploadLink, formData) {
    return (
      axios.create()({
        method: "post",
        data: formData,
        url: uploadLink
      })
    );
  }

  getUpdateLink(repoID, folderPath) {
    const url = this.server + '/api2/repos/' + repoID + '/update-link/?p=' + folderPath;
    return this.req.get(url)
  }

  updateFile(uploadLink, filePath, fileName, data) {
    let formData = new FormData();
    formData.append("target_file", filePath);
    formData.append("filename", fileName);
    let blob = new Blob([data], { type: "text/plain" });
    formData.append("file", blob);
    return (
      axios.create()({
        method: 'post',
        url: uploadLink,
        data: formData,
      })
    );
  }

  listFileHistoryRecords(repoID, path, page, per_page) {
    const url = this.server +  '/api/v2.1/repos/'+ repoID + '/file/new_history/';
    const params = {
      path: path,
      page: page,
      per_page: per_page,
    }
    return this.req.get(url, {params: params});
  }

  getFileRevision(repoID, commitID, filePath) {
    let url = this.server + '/api2/' + 'repos/' + repoID + '/file' + '/revision/?p=' + filePath + '&commit_id=' + commitID
    return this.req.get(url);
  }

  // file commit api
  deleteComment(repoID, commentID) {
    const url = this.server + '/api2/repos/' + repoID + '/file/comments/' + commentID + '/';
    return this.req.delete(url);
  }

  listComments(repoID, filePath, resolved) {
    const path = encodeURIComponent(filePath);
    let url = this.server + '/api2/repos/' + repoID + '/file/comments/?p=' + path;
    if (resolved) {
      url = url + '&resolved=' + resolved;
    }
    return this.req.get(url);
  }

  postComment(repoID, filePath, comment, detail) {
    const path = encodeURIComponent(filePath);
    const url = this.server + '/api2/repos/' + repoID + '/file/comments/?p=' + path;
    let form = new FormData();
    form.append("comment", comment);
    if (detail) {
      form.append("detail", detail);
    }
    return this._sendPostRequest(url, form);
  }

  getCommentsNumber(repoID, path) {
    const p = encodeURIComponent(path);
    const url = this.server + '/api2/repos/' + repoID + '/file/comments/counts/?p=' + p;
    return this.req.get(url);
  }

  updateComment(repoID, commentID, resolved, detail) {
    const url = this.server + '/api2/repos/' + repoID + '/file/comments/' + commentID + '/';
    let params = {
      resolved: resolved
    }
    if (detail) {
      params.detail = detail;
    }
    return this.req.put(url, params);
  }

  getRepoDraftReviewCounts(repoID) {
    const url = this.server + '/api/v2.1/repo/' + repoID + '/draft-review-counts/'
    return this.req.get(url);
  }

  listRepoDrafts(repoID) {
    const url = this.server + '/api/v2.1/repo/' + repoID + '/drafts/';
    return this.req.get(url); 
  }

  // List the review of the open state under the repo
  listRepoReviews(repoID) {
    const url = this.server + '/api/v2.1/repo/' + repoID + '/reviews/';
    return this.req.get(url);
  }

  // draft operation api
  getDraft(id) {
    const url = this.server + '/api/v2.1/drafts/' + id + '/';
    return this.req.get(url)
  }

  listDrafts() {
    const url = this.server + '/api/v2.1/drafts';
    return this.req.get(url);
  }

  createDraft(repoID, filePath) {
    const url = this.server + '/api/v2.1/drafts/';
    const form = new FormData();
    form.append("repo_id", repoID);
    form.append("file_path", filePath);
    return this.req.post(url, form);
  }

  deleteDraft(id) {
    const url = this.server + '/api/v2.1/drafts/' + id + '/';
    return this.req.delete(url);
  }

  publishDraft(id) {
    const url = this.server + '/api/v2.1/drafts/' + id + '/';
    const params = {
      operation: 'publish'
    }
    return this.req.put(url, params);
  }

  // review api
  createDraftReview(id) {
    const url = this.server + '/api/v2.1/reviews/';
    const params = {
      draft_id: id
    }
    return this.req.post(url, params);
  }

  createFileReview(repoID, filePath) {
    const url = this.server + '/api/v2.1/file-review/';
    const form = new FormData();
    form.append("repo_id", repoID);
    form.append("file_path", filePath);
    return this.req.post(url, form);
  }

  listReviews(status) {
    const url = this.server + '/api/v2.1/reviews/?status=' + status;
    return this.req.get(url);
  }

  listReviewers(reviewID) {
    const url = this.server + '/api/v2.1/review/' + reviewID + '/reviewer/';
    return this.req.get(url);
  }

  addReviewers(reviewID, reviewers) {
    const url = this.server + '/api/v2.1/review/' + reviewID + '/reviewer/';
    let form = new FormData();
    for(let i = 0 ; i < reviewers.length ; i ++) {
      form.append('reviewer', reviewers[i]);
    }
    return this._sendPostRequest(url, form);
  }

  deleteReviewer(reviewID, reviewer) {
    const url = this.server + '/api/v2.1/review/' + reviewID + '/reviewer/?username=' + reviewer;
    return this.req.delete(url);
  }

  updateReviewStatus(id, st) {
    const url = this.server + '/api/v2.1/review/'+ id + '/';
    const params = {
      status: st
    }
    return this.req.put(url, params);
  }

  // review comments api
  addReviewComment(reviewID, comment, detail) {
    const url = this.server + '/api2/review/' + reviewID + '/comments/';
    let form = new FormData();
    form.append('comment', comment);
    if (detail) {
      form.append('detail', detail);
    }
    return this._sendPostRequest(url, form);
  }

  listReviewComments(reviewID, page, perPage, avatarSize) {
    const url = this.server + '/api2/review/' + reviewID + '/comments/?page=' + page + '&per_page=' + perPage + '&avatar_size=' + avatarSize;
    return this.req.get(url);
  }

  deleteReviewComment(reviewID, commentID) {
    const url = this.server + '/api2/review/' + reviewID + '/comment/' + commentID + '/';
    return this.req.delete(url);
  }

  updateReviewComment(reviewID, commentID, resolved, detail) {
    const url = this.server + '/api2/review/' + reviewID + '/comment/' + commentID + '/';
    let params = {
      resolved: resolved
    }
    if (detail) {
      params.detail = detail;
    }
    return this.req.put(url, params);
  }

  // starred
  listStarred() {
    const url = this.server + '/api2/starredfiles/';
    return this.req.get(url);
  }

  starFile(repoID, filePath) {
    const url = this.server + '/api2/starredfiles/';
    let form = new FormData();
    form.append('repo_id', repoID);
    form.append('p', filePath);
    return this._sendPostRequest(url, form);
  }

  unStarFile(repoID, filePath) {
    const path = encodeURIComponent(filePath);
    const url = this.server + "/api2/starredfiles/?repo_id=" + repoID + "&p=" + path;
    return this.req.delete(url);
  }

  //---- tags module api
  // repo tags
  listRepoTags(repoID) {
    var url = this.server + '/api/v2.1/repos/' + repoID + '/repo-tags/';
    return this.req.get(url);
  }

  createRepoTag(repoID, name, color) {
    var url = this.server + '/api/v2.1/repos/' + repoID + '/repo-tags/';
    var form = new FormData();
    form.append('name', name);
    form.append('color', color);
    return this._sendPostRequest(url, form);
  }

  deleteRepoTag(repoID, repo_tag_id) {
    var url = this.server + '/api/v2.1/repos/' + repoID + '/repo-tags/' + repo_tag_id + '/';
    return this.req.delete(url);
  }

  updateRepoTag(repoID, repo_tag_id, name, color) {
    var url = this.server + '/api/v2.1/repos/' + repoID + '/repo-tags/' + repo_tag_id + '/';
    var params = {
      name: name,
      color: color,
    };
    return this.req.put(url, params);
  }

  listTaggedFiles(repoID, repoTagId) {
    const url = this.server + '/api/v2.1/repos/' + repoID + '/tagged-files/' + repoTagId + '/';
    return this.req.get(url);
  }

  // file tag api
  listFileTags(repoID, filePath) {
    var p = encodeURIComponent(filePath)
    var url = this.server + '/api/v2.1/repos/' + repoID + '/file-tags/?file_path=' + p;
    return this.req.get(url);
  }

  addFileTag(repoID, filePath, repoTagId) {
    var form = new FormData();
    form.append('file_path', filePath);
    form.append('repo_tag_id', repoTagId);
    var url = this.server + '/api/v2.1/repos/' + repoID + '/file-tags/';
    return this._sendPostRequest(url, form);
  }

  deleteFileTag(repoID, fileTagId) {
    var url = this.server + '/api/v2.1/repos/' + repoID + '/file-tags/' + fileTagId + '/';
    return this.req.delete(url);
  }

  //---- RelatedFile API
  listRelatedFiles(repoID, filePath) {
    const p = encodeURIComponent(filePath);
    const url = this.server + '/api/v2.1/related-files/?repo_id=' + repoID + '&file_path=' + p;
    return this.req.get(url);
  }

  addRelatedFile(oRepoID, rRepoID, oFilePath, rFilePath) {
    const form = new FormData();
    form.append('o_repo_id', oRepoID);
    form.append('r_repo_id', rRepoID);
    form.append('o_path', oFilePath);
    form.append('r_path', rFilePath);
    const url = this.server + '/api/v2.1/related-files/';
    return this._sendPostRequest(url, form);
  }

  deleteRelatedFile(repoID, filePath, relatedID) {
    const url = this.server + '/api/v2.1/related-files/' + relatedID + '/';
    const params = {
      repo_id: repoID,
      file_path: filePath
    };
    return this.req.delete(url, { data: params });
  }

  saveSharedFile(repoID, filePath, sharedToken) {
    const url = this.server + '/share/link/save/?t=' + sharedToken;
    let form = new FormData();
    form.append('dst_repo', repoID);
    form.append('dst_path', filePath);
    form.append('s_token', sharedToken);
    return this._sendPostRequest(url, form);
  }

  getInternalLink(repoID, filePath) {
    const path = encodeURIComponent(filePath);
    const url = this.server + '/api/v2.1/smart-link/?repo_id=' + repoID + '&path=' + path + '&is_dir=false';
    return this.req.get(url);
  }

  getWikiFileContent(slug, filePath) {
    const path = encodeURIComponent(filePath);
    const time = new Date().getTime();
    const url = this.server + '/api/v2.1/wikis/' + slug + '/content/' + '?p=' + path + '&_=' + time;
    return this.req.get(url)
  }

  //---- Avatar API
  getUserAvatar(user, size) {
    const url = this.server + '/api2/avatars/user/' + user + '/resized/' + size +'/';
    return this.req.get(url);
  }

  //---- Notification API
  listPopupNotices() {
    const url = this.server + '/ajax/get_popup_notices/';
    return this.req.get(url, { headers: {'X-Requested-With': 'XMLHttpRequest'}});
  }
  
  updateNotifications() {
    const url = this.server + '/api/v2.1/notifications/';
    return this.req.put(url);
  }

  getUnseenNotificationCount() {
    const url = this.server + '/api/v2.1/notifications/';
    return this.req.get(url);
  }

  //---- Linked Devices API
  listLinkedDevices() {
    const url = this.server + '/api2/devices/';
    return this.req.get(url);
  }
  
  unlinkDevice(platform, device_id) {
    const url = this.server + "/api2/devices/";
    let param = {
      platform: platform,
      device_id: device_id
    };
    return this.req.delete(url, {data: param});
  }
  
  //---- Activities API
  listActivities(pageNum, avatarSize=36) {
    const url = this.server + '/api/v2.1/activities/?page=' + pageNum + '&avatar_size=' + avatarSize;
    return this.req.get(url);
  }

  //---- Thumbnail API
  createThumbnail(repo_id, path, thumbnail_size) {
    const url = this.server + '/thumbnail/' + repo_id + '/create/?path=' +
    encodeURIComponent(path) + '&size=' + thumbnail_size;
    return this.req.get(url, {headers: {'X-Requested-With': 'XMLHttpRequest'}});
  }

  //---- Users API
  searchUsers(searchParam) {
    const url = this.server + '/api2/search-user/?q=' + encodeURIComponent(searchParam);
    return this.req.get(url);
  }

  //---- wiki module API
  listWikis(options) {
    /*
     * options: `{type: 'shared'}`, `{type: ['mine', 'shared', ...]}`
     */
    let url = this.server + '/api/v2.1/wikis/';
    if (!options) {
      // fetch all types of wikis
      return this.req.get(url);
    }
    return this.req.get(url, {
      params: options,
      paramsSerializer: function paramsSerializer(params) {
        let list = [];
        for (let key in params) {
          if (Array.isArray(params[key])) {
            for (let i = 0, len = params[key].length; i < len; i++) {
              list.push(key + '=' + encodeURIComponent(params[key][i]));
            }
          } else {
            list.push(key + '=' + encodeURIComponent(params[key]));
          }
        }
        return list.join('&');
      }
    });
  }

  addWiki(isExist, name, repoID) {
    const url = this.server + '/api/v2.1/wikis/';
    let form = new FormData();
    form.append('use_exist_repo', isExist);
    form.append('repo_id', repoID);
    form.append('name', name);
    return this._sendPostRequest(url, form);
  }

  renameWiki(slug, name) {
    const url = this.server + '/api/v2.1/wikis/' + slug + '/';
    let form = new FormData();
    form.append('wiki_name', name);
    return this._sendPostRequest(url, form);
  }

  updateWikiPermission(wikiSlug, permission) {
    const url = this.server + '/api/v2.1/wikis/' + wikiSlug + '/';
    let params = {
      permission: permission
    };
    return this.req.put(url, params);
  }

  deleteWiki(slug) {
    const url = this.server + '/api/v2.1/wikis/' + slug + '/';
    return this.req.delete(url);
  }

  //----MetaData API
  fileMetaData(repoID, filePath) {
    const url = this.server + '/api2/repos/' + repoID + '/file/metadata/?p=' + filePath;
    return this.req.get(url);
  }

  dirMetaData(repoID, dirPath) {
    const url = this.server + '/api2/repos/' + repoID + '/dir/metadata/?p=' + dirPath;
    return this.req.get(url);
  }
}

export { SeafileAPI };
