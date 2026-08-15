import re

PATH = 'src/integrations/supabase/types.ts'

with open(PATH, 'r', encoding='utf-8') as f:
    raw = f.read()
lines = raw.split('\n')

def strip_strings_and_comments(text):
    out = []
    i = 0
    n = len(text)
    in_line_comment = False
    in_block_comment = False
    in_s = False   # single quote
    in_d = False   # double quote
    in_t = False   # template backtick
    while i < n:
        c = text[i]
        nxt = text[i+1] if i+1 < n else ''
        if in_line_comment:
            if c == '\n':
                in_line_comment = False
                out.append(c)
            i += 1
            continue
        if in_block_comment:
            if c == '*' and nxt == '/':
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue
        if in_s:
            if c == '\\':
                i += 2
                continue
            if c == "'":
                in_s = False
            i += 1
            continue
        if in_d:
            if c == '\\':
                i += 2
                continue
            if c == '"':
                in_d = False
            i += 1
            continue
        if in_t:
            if c == '\\':
                i += 2
                continue
            if c == '`':
                in_t = False
            i += 1
            continue
        if c == '/' and nxt == '/':
            in_line_comment = True
            i += 2
            continue
        if c == '/' and nxt == '*':
            in_block_comment = True
            i += 2
            continue
        if c == "'":
            in_s = True
            i += 1
            continue
        if c == '"':
            in_d = True
            i += 1
            continue
        if c == '`':
            in_t = True
            i += 1
            continue
        out.append(c)
        i += 1
    return ''.join(out)

clean = strip_strings_and_comments(raw)
clean_lines = clean.split('\n')

depth = 0
for idx, line in enumerate(clean_lines, start=1):
    opens = line.count('{')
    closes = line.count('}')
    if opens or closes:
        new = depth + opens - closes
        marker = ''
        # flag an unexpected drop while we expect to be inside the structure
        if new < depth and depth <= 1 and idx <= 528:
            marker = '  <-- DROP'
        print(f"{idx:4d}  depth {depth:2d} +{opens} -{closes} = {new:2d}{marker}  | {line.strip()[:72]}")
        depth = new

print("FINAL depth:", depth)
