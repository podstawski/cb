var fs = require('fs');

var instances=[];

var modelSaveTimer=null;

var saveModel=function(stop) {
    if(modelSaveTimer!=null) clearTimeout(modelSaveTimer);
    for (var k in instances) instances[k].save();
    if (stop==null) modelSaveTimer=setTimeout(saveModel,1000);
}

modelSaveTimer=setTimeout(saveModel,1000);



var Model = function(file,index,logger) {
    var data=[];
    var lastSave=0;
    var lastSet=0;
    var saveState=false;
    instances[file]=this;
    self=this;
    
    if (logger==null) logger=console;
    
    var createIndex = function (data) {
        var ret;
        if (typeof(data)=='object') {   
            var idx=[];
            for (var i=0;i<index.length;i++) {
                idx.push(data[index[i]]);
            }
            ret=idx.join();
        } else {
            ret=data;
        }
        
        if (ret.length>0 && !isNaN(ret)) {
            ret='_'+ret;
        }
        
        return ret;
    };
    
    var getData=function() {
        var d=[];
        for (var k in data) d.push(data[k]);
        return d;        
    };
    
    this.save = function() {

        if (saveState) return;
        if (lastSave>lastSet) return;
        if (lastSet==0) return;
        
        saveState=true;
        
        
        var bak=file+'.bak';
        fs.renameSync(file, bak);
        fs.writeFileSync(file,JSON.stringify(getData()));
        
        logger.log("Saved "+file,'db');
        fs.unlink(bak);
        lastSave=Date.now();
        saveState=false;
    
    }
    
    var open=function (d) {
        try {
            var json = JSON.parse(d);
            
            data={};
            for (var i=0;i<json.length;i++) {
                data[createIndex(json[i])] = json[i];
            }

            lastSave=Date.now();
        } catch (e) {
            logger.log('Data parse error in '+file+', '+e,'db');
        }
        
    }
    
    
    return {
        init: function () {
            self.save();
            fs.readFile(file,function(error,d) {
                if (error) {
                    fs.readFile(file+'.bak',function(error,d) {
                        if (error) {
                            data={};
                            fs.closeSync(fs.openSync(file, 'w'));
                        } else {
                            open(d);
                        }
                    });
                } else {
                    logger.log("Opening "+file,'db');
                    open(d);
                }
            });
            
        },
        
        getAll: function() {
            var ret={recordsTotal:0,data:getData()};
            ret.recordsTotal=ret.data.length;
            return ret;    
        },
        
        get: function(idx) {
            
            idx=createIndex(idx);
            
            if (typeof(data[idx])=='undefined') return null;
            
            return data[idx];
        },
        
        set: function(d,idx) {
            if (idx==null) {
                idx=createIndex(d);
            }
            
            if (typeof(data[idx])=='undefined') {
                logger.log("Index "+idx+" could not be found",'error');
                return;
            }
            var anythingChanged=false;
            
            for (var k in d) {
                if (typeof(data[idx][k])=='undefined' || data[idx][k]!=d[k]) {
                    data[idx][k]=d[k];
                    anythingChanged=true;
                }
                
            }
            
            if (anythingChanged) lastSet=Date.now();
            
            return data[idx];
        },
        
        count: function() {
            return  Object.keys(data).length;
        },
        
        add: function(d) {
            idx=createIndex(d);
            
            var i=Object.keys(data).length+1;
            while (idx.length==0 && index.length==1) {
                d[index[0]]=i++;
                idx=createIndex(d);
                if (typeof(data[idx])=='undefined') break;
            }
           
            if (idx.length==0 ) return;
            data[idx]={};
   
            for (var k in d) {
                data[idx][k]=d[k];
            }

            lastSet=Date.now();
            return d;
            
        },
        
        index: function(data) {
            return createIndex(data);
        },
        
        ultimateSave: function () {
            logger.log('Ultimate save','db');
            saveModel(true);
        }
 
        
    }
    
}



module.exports = Model;