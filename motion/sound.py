import numpy as np,wave
sr=48000
rng=np.random.default_rng(17)
for name,dur,hit in [('opening',5,3.72),('ending',4,2.65)]:
 t=np.arange(int(sr*dur))/sr
 rise=np.clip(t/(hit+.05),0,1)**2*np.exp(-np.maximum(t-hit,0)*7)
 noise=rng.normal(0,1,len(t));sm=np.convolve(noise,np.ones(90)/90,'same')
 whoosh=sm*.52*rise
 phase=2*np.pi*(33*t+7*np.sin(t*.6))
 bass=np.sin(phase)*.12*np.sin(np.pi*np.clip(t/hit,0,1))**2
 h=np.maximum(t-hit,0);gate=(t>=hit)
 strike=gate*(np.sin(2*np.pi*55*h)*.25*np.exp(-h*4)+np.sin(2*np.pi*660*h)*.08*np.exp(-h*5)+np.sin(2*np.pi*991*h)*.035*np.exp(-h*3))
 if name=='ending':
  k=np.maximum(t-3.5,0);strike+=(t>=3.5)*np.sin(2*np.pi*73*k)*.16*np.exp(-k*16)
 x=(whoosh+bass+strike)*np.clip((dur-t)/.2,0,1)
 stereo=np.stack([x,x*.96+np.roll(whoosh,300)*.08],axis=1)
 with wave.open('public/'+name+'.wav','wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(stereo,-1,1)*32767).astype('<i2').tobytes())
