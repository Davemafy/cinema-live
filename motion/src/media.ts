import {staticFile} from 'remotion';
export const mediaFile=(name:string):string=>(typeof window!=='undefined'&&(window as any).__CINEMA_MEDIA?.[name])||staticFile(name);
