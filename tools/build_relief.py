import math, os, io, urllib.request, numpy as np
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
Z=7
def tx(lon): return int((lon+180)/360*2**Z)
def ty(lat): r=math.radians(lat); return int((1-math.log(math.tan(r)+1/math.cos(r))/math.pi)/2*2**Z)
x0,x1=tx(-25),tx(45); y0,y1=ty(72),ty(34)
print(x0,x1,y0,y1,(x1-x0+1)*(y1-y0+1))
def get(xy):
    x,y=xy; p=f'dem/{Z}_{x}_{y}.png'
    if not os.path.exists(p):
        urllib.request.urlretrieve(f'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{Z}/{x}/{y}.png',p)
    return p
tiles=[(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)]
list(ThreadPoolExecutor(8).map(get,tiles))
W=(x1-x0+1)*256; H=(y1-y0+1)*256
E=np.zeros((H,W),np.float32)
for x,y in tiles:
    a=np.asarray(Image.open(f'dem/{Z}_{x}_{y}.png').convert('RGB')).astype(np.float32)
    E[(y-y0)*256:(y-y0+1)*256,(x-x0)*256:(x-x0+1)*256]=a[...,0]*256+a[...,1]+a[...,2]/256-32768
# pixel size (m) per row
n=2**Z; rows=np.arange(H)+y0*256+0.5
lat=np.degrees(np.arctan(np.sinh(math.pi*(1-2*rows/(n*256)))))
res=(156543.03392*np.cos(np.radians(lat))/n)[:,None]
gy,gx=np.gradient(E)
dzdx=gx/res; dzdy=gy/res; zf=3.0
slope=np.arctan(zf*np.hypot(dzdx,dzdy)); aspect=np.arctan2(dzdy,-dzdx)
zen=math.radians(45); az=math.radians(135)
sh=np.clip(np.cos(zen)*np.cos(slope)+np.sin(zen)*np.sin(slope)*np.cos(az-aspect),0,1)
stops=[(-6000,(150,180,210)),(-200,(185,210,230)),(-0.5,(200,222,238)),(0,(172,204,146)),(200,(206,222,160)),(500,(232,222,164)),(1000,(214,184,128)),(1800,(184,146,108)),(2800,(222,214,206)),(4000,(250,250,250))]
xs=[s[0] for s in stops]
rgb=np.stack([np.interp(E,xs,[s[1][i] for s in stops]) for i in range(3)],-1)
sea=E<=0
f=np.where(sea,1.0,0.45+0.65*sh)[...,None]
img=np.clip(rgb*f,0,255).astype(np.uint8)
from math import atan,sinh,pi,degrees
def tlat(yt): return degrees(atan(sinh(pi*(1-2*yt/n))))
print('bounds',[[tlat(y1+1),x0/n*360-180],[tlat(y0),(x1+1)/n*360-180]])
Image.fromarray(img).save('relief_europe_z7.jpg',quality=72,optimize=True)
print(os.path.getsize('relief_europe_z7.jpg')//1024,'KB',W,H)
