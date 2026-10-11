import numpy as np,wave
sr=48000;t=np.arange(sr*10)/sr;rng=np.random.default_rng(2026);n=np.convolve(rng.normal(size=len(t)),np.ones(110)/110,'same');x=np.zeros(len(t))
for start,duration,amp in [(1.5,2.8,.22),(3.65,.7,.5),(5.8,.33,.16),(7.7,.3,.12)]:
 p=np.clip((t-start)/duration,0,1);x+=n*amp*np.sin(np.pi*p)**2
for start,freq,amp,decay in [(4.4,55,.23,1.8),(4.4,440,.065,2),(5.8,146.83,.11,1.6),(7.7,220,.08,1.8),(9.4,73.42,.14,5)]:
 h=np.maximum(0,t-start);x+=(t>=start)*np.sin(2*np.pi*freq*h)*amp*np.exp(-h*decay)*(1-np.exp(-h*90))
x+=.055*np.sin(2*np.pi*36*t)*np.sin(np.pi*np.clip(t/4.4,0,1))**2;x*=np.clip((10-t)/.28,0,1)
stereo=np.stack([x,x*.96+np.roll(n,360)*.015*np.sin(np.pi*t/10)**2],1)
with wave.open('public/final-outro.wav','wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(stereo,-.9,.9)*32767).astype('<i2').tobytes())
