(function ( $ ) {
    var smekta_cache={};
    
    $.extend({
        'smekta': function (pattern,vars,selector,callback) {
            var key,re;
            
            for (key in vars)
            {
                if (vars[key]==null)  vars[key]='';
                
                if (typeof(vars[key])=='object') {
                    re=new RegExp('\\[loop:'+key+'\\](.|[\r\n])+\\[endloop:'+key+'\\]',"g");
                    var loop=pattern.match(re);
                    if (loop!=null) {
                        
                        for (var l=0;l<loop.length && l<7;l++)
                        {
                            var loopstring=loop[l];
                            var loopcontents=loop[l].substr(7+key.length);
                            loopcontents=loopcontents.substr(0,loopcontents.length-10-key.length);
                            var loopresult='';
                            for (var k=0;k<vars[key].length;k++)
                            {
                                loopresult+=$.smekta(loopcontents,vars[key][k]);
                            }
                            pattern=pattern.replace(loopstring,loopresult);
                        }
                        
                    }
                        
                }
                
                
                re=new RegExp('\\[if:'+key+'\\](.|[\r\n])+\\[endif:'+key+'\\]',"g");
                if (vars[key].length==0 || vars[key]==null || vars[key]=='0') pattern=pattern.replace(re,'');
                
                re=new RegExp('\\[if:!'+key+'\\](.|[\r\n])+\\[endif:!'+key+'\\]',"g");
                if (vars[key].length>0 || vars[key]) pattern=pattern.replace(re,'');
                
                
                re=new RegExp('\\['+key+'\\]',"g");
                pattern=pattern.replace(re,vars[key]);
                
                
                pattern=pattern.replace('[if:'+key+']','');
                pattern=pattern.replace('[endif:'+key+']','');
                pattern=pattern.replace('[if:!'+key+']','');
                pattern=pattern.replace('[endif:!'+key+']','');        
                
            }
            
            if (selector!=null) $(selector).html(pattern);
            if (callback!=null) callback(pattern);
            return pattern;
        },
        'smekta_file': function (f,vars,selector,callback) {
            if (typeof(smekta_cache[f])!='undefined') {
                return $.smekta(smekta_cache[f],vars,selector,callback);
            } else {
                $.get(f,function(pattern){
                    smekta_cache[f]=pattern;
                    return $.smekta(pattern,vars,selector,callback);
                });
            }
        }
    });
})(jQuery);