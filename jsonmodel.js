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
    
    var indexElement = function (ret) {
        
        if (typeof(ret)=='number' || !isNaN(parseInt(ret))) {
            var len=String(ret).length;
            var prefix='_';
            for (var i=0;i<16-len;i++) {
                prefix+='0';
            }
            ret=prefix+ret;
        }
        
        return ret;
    }
    
    var createIndex = function (data,ia) {
        if (ia==null) ia=index;
        
        if (typeof(data)=='object') {   
            var idx=[];
            for (var i=0;i<ia.length;i++) {
                var element='_';
                if (typeof(data[ia[i]])!='undefined') {
                    element=indexElement(data[ia[i]]);
                }
                idx.push(element);
            }
            return idx.join();
        } else {
            return indexElement(data);
        }
        
        
        
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
        
    };
    
    var condition = function (rec,where) {
        if (where==null) where=[{}];
        
        for (var i=0;i<where.length;i++) {
            var cond=true;
            for (var c in where[i]) {
                if (typeof(rec[c])=='undefined' && where[i][c]!=null) cond=false;
                if (typeof(where[i][c])=='object' && where[i][c]!=null) {
                    
                } else {
                    if (where[i][c]!=rec[c]) cond=false;
                }
            }
            if (cond) return true;
        }
        
        return false;
        
    }
    
    
    var max_element=function (element,where) {
        var max=0;
        for (var k in data) {
            if (!condition(data[k],where)) continue;
            if (typeof(data[k][element])!='undefined') if (data[k][element]>max) max=data[k][element];
        }
        return max;
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
        
        select: function (where,order) {
            var ret={};
                        
            for (var k in data) {    
                if (condition(data[k],where)) {
                    var idx=createIndex(data[k],order);
                    if (typeof(ret[idx])=='undefined') ret[idx]=[]; 
                    ret[idx].push(data[k]);
                }
            }
            
            ret2=[];
            var keys=Object.keys(ret);
            keys.sort();
            for (i=0;i<keys.length;i++) {
                for (var j=0;j<ret[keys[i]].length;j++) {
                    ret2.push(ret[keys[i]][j]);
                }
            }
            
            var ret={recordsTotal:0,data:ret2};
            ret.recordsTotal=ret.data.length;            
            
            return ret;
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
     
            if (idx=='_' && index.length==1) {
                d[index[0]]=max_element(index[0])+1;
                idx=createIndex(d);
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
        
        max: function(element,where) {
            return max_element(element,where);  
        },
        
        ultimateSave: function () {
            logger.log('Ultimate save','db');
            saveModel(true);
        }
 
        
    }
    
}



module.exports = Model;