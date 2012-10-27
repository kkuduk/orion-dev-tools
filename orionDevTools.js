/*******************************************************************************
 * Eclipse Orion Hackathon 2012
 * kkuduk
 ******************************************************************************/

DevToolsIntegration = ( function() {

		function DevToolsIntegration(){}

		DevToolsIntegration.prototype = {

		/**
		* Writes the contents or metadata of the file at the given location.
		*
		* @param {String} location The location of the file to set contents for
		* @param {String|Object} contents The content string, or metadata object to write
		* @param {String|Object} args Additional arguments used during write operation (i.e. ETag)
		* @return A deferred for chaining events after the write completes with new metadata object
		*/
		write: function(location, contents, args) {
			var that = this;
			return this._getEntry(location).then(function(entry){
				return entry;
			}, function() {
				var lastSlash = location.lastIndexOf("/");
				var parentLocation = (lastSlash === -1) ? this._rootLocation : location.substring(0, lastSlash + 1);
				var name = decodeURIComponent(location.substring(lastSlash +1));
				return that.createFile(parentLocation, name).then(function() {
					return that._getEntry(location);
				});
			}).then(function(entry) {
				var d = new orion.Deferred();
				entry.createWriter(function(writer) {
					var builder = new window.BlobBuilder();
					if (contents) {
						builder.append(contents);
					}
					var blob = builder.getBlob();
					writer.write(blob);
					var truncated = false;
					writer.onwrite = function() {
						if (!truncated) {
							truncated = true;
							writer.truncate(blob.size);
						} else {
							createFile(entry).then(d.resolve, d.reject);
						}
					};
					writer.onerror = function() {
						d.reject(writer.error);
					};
				});
				return d;
			});
		},

		resolveEntryURL: function(url) {
		var d = new orion.Deferred();
		window.resolveLocalFileSystemURL(url, d.resolve, d.reject);
		return d;
		}
	};

	return DevToolsIntegration;
}());

window.onload = function() {
    var headers = {
         name: "Chrome Dev Tools integration",
         version: "0.1",
         description: "Chrome Dev Tools plugin prototype for Hackathon."
    };
    var provider = new orion.PluginProvider(headers);
    var serviceImpl = new DevToolsIntegration();
	var serviceProperties = { };
	provider.registerService("orion.core.file", serviceImpl, serviceProperties);
    provider.connect();
};


