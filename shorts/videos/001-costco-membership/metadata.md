# 001 Costco: publishing pack

> **Not ready to upload yet**
> - The call to action is still a placeholder: fill in `cta` in `channel.json` and run the pipeline again.
> - This render uses the fallback voice. Record `voice.wav` before uploading.

## Titles (pick one; each is under 60 characters)
1. Costco's real product is a $65 card  `35`
2. Costco's fees equal half its profit  `35`
3. The $5.3 billion Costco makes at the door  `41`

## Description
```
Costco sells its goods at almost no profit. The fees shoppers pay just to walk in add up to about half of what it earns from running the business.

[YOUR CALL TO ACTION: fill in "cta" in channel.json]

Sources:
- Costco Wholesale Corporation, "Reports Fourth Quarter and Fiscal Year 2025 Operating Results" (fiscal 2025): https://investor.costco.com/news/news-details/2025/Costco-Wholesale-Corporation-Reports-Fourth-Quarter-and-Fiscal-Year-2025-Operating-Results/default.aspx
- CNN Business, "Costco membership fee price increase" (2024): https://amp.cnn.com/cnn/2024/09/03/business/costco-membership-fee-price-increase

This video explains how a business works. It is not financial advice.

#Costco #business #money
```

## Hashtags
#Costco #business #money

## Pinned comment
Would you still shop there if the card cost double? Every number in this video is sourced in the description.

## AI-content disclosure ("Altered or synthetic content")
**Yes, tick it for this file.** The narration in this render is the synthetic fallback voice, not yours. YouTube's rule covers realistic altered or synthetic content; its help page does not spell out a synthetic narrator reading true facts, so disclosing is the safe choice. Better: record voice.wav and run the pipeline again, and the answer becomes No.

Reference: https://support.google.com/youtube/answer/14328491

## At upload
- Audience: **not** made for kids
- Cover: choose the frame saved as `cover.png` (the claim, fully landed)
- Subtitles: upload `captions.srt` as English captions, so the words are searchable and readable with sound off
- After posting: pin the comment above, then `node pipeline/cli.mjs mark 001 uploaded`

<sub>Generated from script.md, sources.md and channel.json. Edit those, not this file.</sub>
