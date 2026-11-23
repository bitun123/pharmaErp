import dotenv from "dotenv"
dotenv.config()
import  pino from 'pino'
import { pinoHttp } from 'pino-http'
import crypto from 'crypto';

const isDev = process.env.NODE_ENV !== "production"

export const  logger  = pino({
    level:process.env.LOG_LEVEL || (isDev? 'debug' : 'info'),
    redact:{
        paths:[
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.token',
        ],
        censor:'[REDACTED]'
    },
transport: isDev ? {
    target:'pino-pretty',
    options:{
        colorize:true,
        tranlateTime:'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
    }
}: undefined,
})
export const  httpLogger = pinoHttp({
    logger,
    genReqId:(req,res)=>{
        const existingId = req.headers['x-request-id'];
    if (existingId) return existingId;
    const id = crypto.randomUUID().slice(0, 8);
    res.setHeader('X-Request-Id', id);
    return id;
    },
    customLogLevel:(_reg,res,err)=>{
        if(res.statusCode>=500){
            return 'error'
        };
        if(res.statusCode>=400) {
            return 'warn'
        };
        return 'info';
    },
    customSuccessMessage:(req,res,responseTime)=>{
        return `${req.method} ${req.url} -> ${res.statusCode} (${Math.round(responseTime)}ms)`;
    },
    customErrorMessage:(req,res,err)=>{
        return `${req.method} ${req.url} -> ${res.statusCode} | Error: ${err.message}`;
    },
    serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
})