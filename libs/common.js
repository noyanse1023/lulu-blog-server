const crypto=require('crypto');
module.exports={
	//这东西不能丢
	MD5_SUFFIX: 'ergveringnvginbiojncrurugbb*&^5$4$###bregbj哈哈哈哈',
	md5: function(str){
		var obj=crypto.createHash('md5');

		obj.update(str);

		return obj.digest('hex');
	}
}

