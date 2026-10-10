// Restricted container does not expose network interfaces. Renderer only needs loopback.
const os=require('node:os');const actual=os.networkInterfaces;os.networkInterfaces=()=>{try{return actual()}catch{return {lo:[{address:'127.0.0.1',netmask:'255.0.0.0',family:'IPv4',mac:'00:00:00:00:00:00',internal:true,cidr:'127.0.0.1/8'}]}}};
