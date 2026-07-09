# Prompt Gallery Design Layout QA

Command: node scripts/qa/browser-design-layout.mjs --output .omo/evidence/ui-6-prompt-gallery-design-application.md
Base URL: http://127.0.0.1:5173
Output: .omo/evidence/ui-6-prompt-gallery-design-application.md
Exit code: 0
Local app started: yes
Result: PASS

## Assertions
- Light design tokens are active on the rendered app shell.
- Desktop prompt row renders no more than 4 non-image cards.
- Prompt, Workflow, and Repo cards are square.
- Image prompt cards use natural-ratio masonry: wide < square < tall.
- Mobile/tablet/desktop viewports have no horizontal overflow.

## Fixture
```json
{
  "suffix": "1783579935125-ad61d7",
  "prompts": [
    "DesignQA Prompt 1 1783579935125-ad61d7",
    "DesignQA Prompt 2 1783579935125-ad61d7",
    "DesignQA Prompt 3 1783579935125-ad61d7",
    "DesignQA Prompt 4 1783579935125-ad61d7"
  ],
  "repos": [
    "DesignQA Repo 1 1783579935125-ad61d7",
    "DesignQA Repo 2 1783579935125-ad61d7"
  ],
  "workflows": [
    "DesignQA Workflow 1 1783579935125-ad61d7",
    "DesignQA Workflow 2 1783579935125-ad61d7"
  ],
  "images": [
    {
      "key": "wide",
      "title": "DesignQA Image Wide 1783579935125-ad61d7",
      "width": 1200,
      "height": 640,
      "id": "65385b3c-060d-4d01-8bce-1eba7313fe87"
    },
    {
      "key": "square",
      "title": "DesignQA Image Square 1783579935125-ad61d7",
      "width": 900,
      "height": 900,
      "id": "7e6d9760-b897-4e7a-82de-ff862bf5b980"
    },
    {
      "key": "tall",
      "title": "DesignQA Image Tall 1783579935125-ad61d7",
      "width": 640,
      "height": 1240,
      "id": "7db487e8-a2ea-4922-a51d-2604a4e088ad"
    }
  ]
}
```

## Color Samples
```json
[
  {
    "viewport": "mobile",
    "colorScheme": "light",
    "surfaceBase": "#f6f5f4",
    "bodyBackground": "rgb(246, 245, 244)"
  },
  {
    "viewport": "tablet",
    "colorScheme": "light",
    "surfaceBase": "#f6f5f4",
    "bodyBackground": "rgb(246, 245, 244)"
  },
  {
    "viewport": "desktop",
    "colorScheme": "light",
    "surfaceBase": "#f6f5f4",
    "bodyBackground": "rgb(246, 245, 244)"
  }
]
```

## Screenshots
- mobile/all: .omo/evidence/ui-6-prompt-gallery-design-application-mobile-all.png (149564 bytes)
- tablet/all: .omo/evidence/ui-6-prompt-gallery-design-application-tablet-all.png (125985 bytes)
- desktop/all: .omo/evidence/ui-6-prompt-gallery-design-application-desktop-all.png (109525 bytes)

## Dev Server Logs
- stdout: .omo/evidence/ui-6-prompt-gallery-design-application-dev.stdout.log
- stderr: .omo/evidence/ui-6-prompt-gallery-design-application-dev.stderr.log

