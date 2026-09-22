"""Schematic physical previews, separate from the downloadable card artwork."""
def content(n,side=0):
    return inner(cards[n-1]['svgs'][side]).replace('window-0','mock-window-0').replace('window-1','mock-window-1')
def demo(n,body):
    svg=wrap(body,'#e8e0d7',1050,640,cards[n-1]['name']+' — use illustration')
    cards[n-1]['demo']=svg
    (ROOT/f'{cards[n-1]["slug"]}-use-preview.svg').write_text(svg)

demo(6,img('gallery-bouquet.jpg',297,26,666,560)+'<g transform="translate(52 171) scale(.75)">'+content(6)+'</g>')

demo(7,'<defs><clipPath id="left-half"><rect width="525" height="600"/></clipPath><clipPath id="right-half"><rect x="525" width="525" height="600"/></clipPath></defs>'+ '<g transform="translate(56 34) rotate(-5 236 270) scale(.8)"><g clip-path="url(#left-half)">'+content(7)+'</g></g><g transform="translate(96 58) rotate(5 761 270) scale(.8)"><g clip-path="url(#right-half)">'+content(7)+'</g></g>')

demo(9,f'<ellipse cx="530" cy="520" rx="450" ry="58" fill="#29151f16"/><path d="M120 100L803 205L980 530L748 553Z" fill="{INK}"/>'+'<g transform="matrix(.65 .10 -.09 .58 120 100)">'+content(9)+'</g>'+rect(698,528,278,69,CREAM)+rect(690,520,278,69,BLUSH)+rect(682,512,278,69,PINK)+text('TAKE ONE',820,556,29,INK,anchor='middle'))

# Show the inside partially open, with a visible center fold.
demo(12,'<defs><clipPath id="inside-left"><rect width="1050" height="600"/></clipPath><clipPath id="inside-right"><rect x="1050" width="1050" height="600"/></clipPath></defs>'+f'<path d="M55 215L510 119L988 216L988 509L510 590L55 508Z" fill="#29151f20"/>'+'<g transform="matrix(.44 -.08 0 .58 48 224)"><g clip-path="url(#inside-left)">'+content(12,1)+'</g></g><g transform="matrix(.44 .08 0 .58 48 56)"><g clip-path="url(#inside-right)">'+content(12,1)+'</g></g>')
