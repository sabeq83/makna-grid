## **PATCH IMPLEMENTATION — TIKTOK COMPLIANCE GATE**

Do not discard or restart the existing Strategic Pillar Campaign implementation plan.

Extend the current architecture by adding a TikTok Compliance Gate between Call 1 — Creative Production Engine and Call 2 — Publishing Engine.

### **Updated Pipeline**

Content Planner  
→ Strategic Campaign Item  
→ Call 1 Creative Production  
→ Creative Content Package  
→ TikTok Compliance Gate  
→ Call 2 Publishing Engine  
→ Final Publishing Compliance  
→ Final Content Package

### **TikTok Compliance Gate Responsibilities**

The compliance gate must inspect:

* Final Hook  
* Master Voice-over  
* Scene-level voice-over  
* On-screen text  
* Visual actions  
* Product category  
* Product claims  
* Target market  
* Selling intent

It must detect:

* Disease treatment claims  
* Disease prevention claims  
* Diagnosis claims  
* Guaranteed, instant, or permanent results  
* Unsupported scientific claims  
* Doctor or authority endorsement claims  
* Before-and-after implications  
* Weight-loss and body-transformation claims  
* Fear-based health claims  
* Exaggerated ingredient benefits  
* Medical misinformation  
* Restricted product categories

### **Compliance Result Schema**

{  
  "status": "pass | revise | block | human\_review",  
  "risk\_level": "low | medium | high | critical",  
  "detected\_issues": \[  
    {  
      "field": "master\_voice\_over",  
      "scene\_number": null,  
      "category": "disease\_treatment\_claim",  
      "original\_text": "",  
      "reason": "",  
      "policy\_reference": ""  
    }  
  \],  
  "fields\_to\_revise": \[\],  
  "safe\_revisions": {},  
  "human\_review\_required": false  
}

### **Validation Method**

Use a hybrid architecture:

1. Rule-based risk lexicon and pattern scanner.  
2. Product-specific compliance profile.  
3. Gemini semantic compliance reviewer.  
4. Human review queue for ambiguous or high-risk health content.

### **Product Compliance Profile**

Add product metadata:

{  
  "medical\_claims\_allowed": false,  
  "allowed\_claims": \[\],  
  "restricted\_claims": \[\],  
  "required\_disclaimers": \[\],  
  "risk\_category": "normal | health\_sensitive | restricted"  
}

### **Workflow Rules**

* Call 2 may only execute when creative compliance status is `pass`.  
* A `revise` result must trigger selective regeneration of only the affected fields.  
* A `block` result must stop automatic processing.  
* A `human_review` result must require manual approval.  
* After Call 2, run a final compliance review across voice-over, on-screen text, caption, CTA, hashtags, title, description, product, and visuals.  
* A Final Content Package may only receive `approved_for_production` when both creative and publishing compliance checks pass.

### **New Statuses**

compliance\_scanning  
compliance\_revision\_required  
compliance\_passed  
compliance\_blocked  
human\_review\_required  
publishing\_compliance\_scanning  
publishing\_compliance\_passed

### **Database Additions**

Create:

compliance\_reviews  
\- id  
\- campaign\_item\_id  
\- creative\_content\_package\_id  
\- publishing\_content\_package\_id  
\- platform  
\- review\_stage  
\- status  
\- risk\_level  
\- detected\_issues\_json  
\- safe\_revisions\_json  
\- reviewer\_type  
\- policy\_version  
\- created\_at  
\- updated\_at

Store the compliance rule version and TikTok policy version used for every review.

Do not place the compliance responsibility only inside Call 2\. Voice-over and on-screen text originate in Call 1 and must be validated before publishing generation begins.

