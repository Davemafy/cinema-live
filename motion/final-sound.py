import numpy as np,wave
sr=48000;t=np.arange(sr*10)/sr;rng=np.random.default_rng(2026);n=np.convolve(rng.normal(size=len(t)),np.ones(110)/110,'same');x=np.zeros(len(t))
for start,duration,amp in [(1.5,2.8,.22),(3.65,.7,.5),(5.8,.33,.16),(7.7,.3,.12)]:
 p=np.clip((t-start)/duration,0,1);x+=n*amp*np.sin(np.pi*p)**2
for start,freq,amp,decay in [(4.5,55,.23,1.8),(4.5,440,.065,2),(5.8,146.83,.11,1.6),(7.7,220,.08,1.8),(9.4,73.42,.14,5)]:
 h=np.maximum(0,t-start);x+=(t>=start)*np.sin(2*np.pi*freq*h)*amp*np.exp(-h*decay)*(1-np.exp(-h*90))
x+=.055*np.sin(2*np.pi*36*t)*np.sin(np.pi*np.clip(t/4.4,0,1))**2;x*=np.clip((10-t)/.28,0,1)
stereo=np.stack([x,x*.96+np.roll(n,360)*.015*np.sin(np.pi*t/10)**2],1)
with wave.open('public/final-outro.wav','wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(stereo,-.9,.9)*32767).astype('<i2').tobytes())

# Authored opening: discovery, accelerated passage, film-gate closure and identity.
t=np.arange(sr*5)/sr;rng=np.random.default_rng(404);n=np.convolve(rng.normal(size=len(t)),np.ones(70)/70,'same');x=np.zeros(len(t))
for start,duration,amp in [(.18,.55,.09),(1.7,1.4,.3),(2.95,.84,.45)]:
 p=np.clip((t-start)/duration,0,1);x+=n*amp*np.sin(np.pi*p)**2
for start,freq,amp,decay in [(.28,880,.035,14),(1.08,55,.07,2.5),(3.72,55,.24,3),(3.72,660,.06,3.5),(3.72,990,.025,2.8)]:
 h=np.maximum(0,t-start);x+=(t>=start)*np.sin(2*np.pi*freq*h)*amp*np.exp(-h*decay)*(1-np.exp(-h*120))
x+=.055*np.sin(2*np.pi*35*t)*np.sin(np.pi*np.clip(t/3.7,0,1))**2;x*=np.clip((5-t)/.22,0,1)
stereo=np.stack([x,x*.96+np.roll(n,280)*.012*np.sin(np.pi*t/5)**2],1)
with wave.open('public/directed-opening.wav','wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(stereo,-.9,.9)*32767).astype('<i2').tobytes())
