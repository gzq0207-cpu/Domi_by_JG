const JSZip=require('jszip');
const zlib=require('node:zlib');
function chartPng() {
  const crc=buffer=>{let value=0xffffffff;for(const byte of buffer){value^=byte;for(let i=0;i<8;i++)value=(value>>>1)^((value&1)?0xedb88320:0);}return (value^0xffffffff)>>>0;};
  const chunk=(name,data)=>{const type=Buffer.from(name),length=Buffer.alloc(4),sum=Buffer.alloc(4);length.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([length,type,data,sum]);};
  const width=160,height=90,header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
  const rows=[];for(let y=0;y<height;y++){const row=Buffer.alloc(width*3+1);for(let x=0;x<width;x++){const i=1+x*3,bar=x>22&&x<130&&y>20&&y<72;row[i]=bar?98:245;row[i+1]=bar?132:245;row[i+2]=bar?116:240;}rows.push(row);}
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(Buffer.concat(rows))),chunk('IEND',Buffer.alloc(0))]);
}
async function wordFixture() {
  const zip=new JSZip(),W='http://schemas.openxmlformats.org/wordprocessingml/2006/main',R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/></Types>');
  zip.file('_rels/.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.file('word/_rels/document.xml.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="${R}/styles" Target="styles.xml"/><Relationship Id="rIdComments" Type="${R}/comments" Target="comments.xml"/><Relationship Id="rIdImage" Type="${R}/image" Target="media/chart.png"/><Relationship Id="externalImage" Type="${R}/image" TargetMode="External" Target="https://example.invalid/private.png"/></Relationships>`);
  zip.file('word/styles.xml',`<w:styles xmlns:w="${W}"><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr></w:style></w:styles>`);
  zip.file('word/comments.xml',`<w:comments xmlns:w="${W}"><w:comment w:id="3" w:author="Original author"><w:p><w:r><w:t>原文件已有的评论</w:t></w:r></w:p></w:comment></w:comments>`);
  zip.file('word/document.xml',`<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="${W}" xmlns:r="${R}" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>
  <w:p w14:paraId="00000001"><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:commentRangeStart w:id="3"/><w:r><w:t>收入与留存研究</w:t></w:r><w:commentRangeEnd w:id="3"/><w:r><w:commentReference w:id="3"/></w:r></w:p>
  <w:p w14:paraId="00000002"><w:r><w:rPr><w:b/></w:rPr><w:t>订阅服务收入</w:t></w:r><w:r><w:rPr><w:color w:val="245768"/></w:rPr><w:t>同比增长25%。</w:t></w:r></w:p>
  <w:p w14:paraId="00000003"><w:r><w:t>客户续费仍需核实。</w:t></w:r></w:p>
  <w:tbl><w:tblPr><w:tblW w:w="8000" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="4000"/><w:gridCol w:w="4000"/></w:tblGrid><w:tr><w:tc><w:p><w:r><w:t>指标</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>数值</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>留存率</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>90%</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
  <w:p w14:paraId="00000008"><w:r><w:drawing><wp:inline><wp:extent cx="3048000" cy="1714500"/><wp:docPr id="1" name="收入图表" descr="收入增长图表"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="chart.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImage"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="3048000" cy="1714500"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>
  <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`);
  zip.file('word/media/chart.png',chartPng());return zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
}
module.exports={wordFixture,chartPng};
