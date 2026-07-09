# Prompt Gallery Design Layout QA

Command: node scripts/qa/browser-design-layout.mjs --output .omo/evidence/f3-prompt-gallery-design-application.md
Base URL: http://127.0.0.1:5173
Output: .omo/evidence/f3-prompt-gallery-design-application.md
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
  "suffix": "1783583516425-9c9d33",
  "prompts": [
    "DesignQA Prompt 1 1783583516425-9c9d33",
    "DesignQA Prompt 2 1783583516425-9c9d33",
    "DesignQA Prompt 3 1783583516425-9c9d33",
    "DesignQA Prompt 4 1783583516425-9c9d33"
  ],
  "repos": [
    "DesignQA Repo 1 1783583516425-9c9d33",
    "DesignQA Repo 2 1783583516425-9c9d33"
  ],
  "workflows": [
    "DesignQA Workflow 1 1783583516425-9c9d33",
    "DesignQA Workflow 2 1783583516425-9c9d33"
  ],
  "images": [
    {
      "key": "wide",
      "title": "DesignQA Image Wide 1783583516425-9c9d33",
      "width": 1200,
      "height": 640,
      "id": "83a3c769-803b-4b49-adb2-5636fe569e9f"
    },
    {
      "key": "square",
      "title": "DesignQA Image Square 1783583516425-9c9d33",
      "width": 900,
      "height": 900,
      "id": "6ae4dc2a-e133-44a1-b9ca-04b0d18ec9cf"
    },
    {
      "key": "tall",
      "title": "DesignQA Image Tall 1783583516425-9c9d33",
      "width": 640,
      "height": 1240,
      "id": "5cfb99dc-e981-4cea-b51c-c352260ee2b1"
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

## Geometry Metrics
```json
[
  {
    "viewport": "mobile",
    "overflowPx": 0,
    "squareCards": {
      "DesignQA Prompt 1 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 2 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 3 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 4 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Repo 1 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Repo 2 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Workflow 1 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Workflow 2 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      }
    }
  },
  {
    "viewport": "tablet",
    "overflowPx": 0,
    "squareCards": {
      "DesignQA Prompt 1 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 2 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 3 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 4 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Repo 1 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Repo 2 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Workflow 1 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Workflow 2 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      }
    }
  },
  {
    "viewport": "desktop",
    "overflowPx": 0,
    "squareCards": {
      "DesignQA Prompt 1 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 2 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 3 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Prompt 4 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Repo 1 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Repo 2 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Workflow 1 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      },
      "DesignQA Workflow 2 1783583516425-9c9d33": {
        "width": 264,
        "height": 264
      }
    },
    "desktopGrid": {
      "firstRowCount": 4
    },
    "imageMasonry": {
      "wide": 346,
      "square": 453,
      "tall": 644
    }
  }
]
```

## Screenshots
- mobile/all: .omo/evidence/f3-prompt-gallery-design-application-mobile-all.png (153239 bytes)
- tablet/all: .omo/evidence/f3-prompt-gallery-design-application-tablet-all.png (125950 bytes)
- desktop/all: .omo/evidence/f3-prompt-gallery-design-application-desktop-all.png (109752 bytes)

## Dev Server Logs
- stdout: .omo/evidence/f3-prompt-gallery-design-application-dev.stdout.log
- stderr: .omo/evidence/f3-prompt-gallery-design-application-dev.stderr.log

