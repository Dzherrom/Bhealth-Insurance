import re
from html.parser import HTMLParser

class StructureParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.output = []
        self.indent = 0
        self.in_body = False

    def handle_starttag(self, tag, attrs):
        if tag == 'body':
            self.in_body = True
        if not self.in_body: return
        
        attr_dict = dict(attrs)
        classes = attr_dict.get('class', '')
        if tag in ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'a', 'button']:
            self.output.append('  ' * self.indent + f'<{tag} class="{classes}">')
        self.indent += 1

    def handle_endtag(self, tag):
        if not self.in_body: return
        self.indent = max(0, self.indent - 1)

    def handle_data(self, data):
        if not self.in_body: return
        data = data.strip()
        if data:
            self.output.append('  ' * self.indent + data)

with open(r'c:\Users\skrea\Downloads\detalles de poliza.html', 'r', encoding='utf-8') as f:
    text = f.read()
    text = re.sub(r'<script.*?>.*?</script>', '', text, flags=re.DOTALL)
    text = re.sub(r'<style.*?>.*?</style>', '', text, flags=re.DOTALL)
    text = re.sub(r'<svg.*?>.*?</svg>', '', text, flags=re.DOTALL)
    text = re.sub(r'data:image/.*?;base64,[A-Za-z0-9+/=]+', '...', text)
    
    parser = StructureParser()
    parser.feed(text)
    
    # Save parsed structure to a file to read easily
    with open('parsed_structure.txt', 'w', encoding='utf-8') as out:
        out.write('\n'.join(parser.output))
