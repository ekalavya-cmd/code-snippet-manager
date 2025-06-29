// Logging functionality for development
function logToFile(message, level = "INFO") {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${level}: ${message}`;

  // Store in localStorage for development (accessible in VS Code via browser dev tools)
  try {
    const logs = JSON.parse(localStorage.getItem("snippetManagerLogs") || "[]");
    logs.push(logEntry);
    // Keep last 200 logs to prevent localStorage overflow
    const recentLogs = logs.slice(-200);
    localStorage.setItem("snippetManagerLogs", JSON.stringify(recentLogs));

    // Also log to console for VS Code terminal visibility
    console.log(`📝 ${logEntry}`);

    // For debugging: you can view all logs by running this in browser console:
    // console.table(JSON.parse(localStorage.getItem('snippetManagerLogs')))
  } catch (error) {
    console.error("Failed to write log:", error);
  }
}

// Export logs function for debugging
function exportLogs() {
  const logs = JSON.parse(localStorage.getItem("snippetManagerLogs") || "[]");
  const logText = logs.join("\n");
  const blob = new Blob([logText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `snippet_manager_logs_${
    new Date().toISOString().split("T")[0]
  }.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Clear logs function
function clearLogs() {
  localStorage.removeItem("snippetManagerLogs");
  logToFile("Logs cleared by user", "INFO");
}

angular
  .module("SnippetApp", ["ngRoute"])
  .filter("capitalize", function () {
    return function (input) {
      if (!input) return input; // Handle null or undefined
      const languageMap = {
        javascript: "JavaScript",
        python: "Python",
        java: "Java",
        html: "HTML",
        css: "CSS",
        ruby: "Ruby",
        php: "PHP",
        sql: "SQL",
      };
      return languageMap[input.toLowerCase()] || input;
    };
  })
  .config(function ($routeProvider) {
    logToFile("Application configuration started", "INFO");
    $routeProvider
      .when("/login", {
        templateUrl: "login.html",
        controller: "AuthController",
      })
      .when("/register", {
        templateUrl: "register.html",
        controller: "AuthController",
      })
      .when("/app", {
        templateUrl: "app.html",
        controller: "SnippetController",
      })
      .otherwise({
        redirectTo: "/login",
      });
    logToFile("Application routes configured successfully", "INFO");
  })
  .controller("AuthController", function ($scope, $http, $location) {
    logToFile("AuthController initialized", "INFO");

    // Initialize loginData and registerData with empty strings to ensure binding works
    $scope.loginData = { email: "", password: "" };
    $scope.registerData = { email: "", username: "", password: "" };
    $scope.errorMessage = "";
    $scope.errors = { email: "", password: "", username: "" };

    $scope.clearErrors = function () {
      $scope.errorMessage = "";
      $scope.errors = { email: "", password: "", username: "" };
      logToFile("Form errors cleared", "DEBUG");
    };

    $scope.register = function () {
      logToFile("Registration attempt started", "INFO");
      $scope.clearErrors();
      let hasError = false;

      // Validate email
      if (!$scope.registerData.email) {
        $scope.errors.email = "Please enter your email.";
        hasError = true;
      } else if (!/^[^\s@]+@csm\.com$/.test($scope.registerData.email)) {
        $scope.errors.email =
          "Email must be a valid @csm.com address (e.g., user@csm.com).";
        hasError = true;
      }
      // Validate password
      if (!$scope.registerData.password) {
        $scope.errors.password = "Please enter your password.";
        hasError = true;
      }
      // Validate username
      if (!$scope.registerData.username) {
        $scope.errors.username = "Please enter your username.";
        hasError = true;
      }

      if (hasError) {
        logToFile("Registration validation failed", "WARN");
        return;
      }

      logToFile(
        `Registration request for user: ${$scope.registerData.username}`,
        "INFO"
      );

      $http
        .post("http://localhost:3000/register", $scope.registerData)
        .then((response) => {
          logToFile(
            `Registration successful for user: ${$scope.registerData.username}`,
            "SUCCESS"
          );
          $location.path("/login");
        })
        .catch((err) => {
          logToFile(
            `Registration failed: ${err.data?.message || err.status}`,
            "ERROR"
          );
          $scope.errorMessage =
            "Registration failed: " + (err.data.message || "Unknown error");
        });
    };

    $scope.login = function () {
      logToFile("Login attempt started", "INFO");
      $scope.clearErrors();
      let hasError = false;

      if (!$scope.loginData.email) {
        $scope.errors.email = "Please enter your email or username.";
        hasError = true;
      }
      if (!$scope.loginData.password) {
        $scope.errors.password = "Please enter your password.";
        hasError = true;
      }

      if (hasError) {
        logToFile("Login validation failed", "WARN");
        return;
      }

      const loginPayload = {
        emailOrUsername: $scope.loginData.email.trim(),
        password: $scope.loginData.password.trim(),
      };

      logToFile(`Login request for: ${loginPayload.emailOrUsername}`, "INFO");

      $http
        .post("http://localhost:3000/login", loginPayload)
        .then((response) => {
          logToFile(
            `Login successful for: ${loginPayload.emailOrUsername}`,
            "SUCCESS"
          );
          localStorage.setItem("token", response.data.token);
          const token = response.data.token;
          const payload = JSON.parse(atob(token.split(".")[1]));
          localStorage.setItem("role", payload.role);
          logToFile(`User role set to: ${payload.role}`, "INFO");
          $location.path("/app");
        })
        .catch((err) => {
          logToFile(
            `Login failed: ${err.data?.message || err.status}`,
            "ERROR"
          );
          $scope.errorMessage =
            "Login failed: " + (err.data.message || "Unknown error");
        });
    };

    $scope.goToLogin = function () {
      logToFile("Navigating to login page", "INFO");
      $location.path("/login");
    };

    $scope.goToRegister = function () {
      logToFile("Navigating to register page", "INFO");
      $location.path("/register");
    };

    $scope.onEnter = function (event, nextFieldId, submitFunction) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (nextFieldId) {
          const nextField = document.getElementById(nextFieldId);
          if (nextField) nextField.focus();
        } else if (submitFunction) {
          submitFunction();
        }
      }
    };
  })
  .controller(
    "SnippetController",
    function ($scope, $http, $location, $timeout) {
      logToFile("SnippetController initialized", "INFO");

      $scope.snippets = [];
      $scope.filteredSnippets = [];
      $scope.collectionSnippets = [];
      $scope.filteredCollectionSnippets = [];
      $scope.collectionSnippetIds = new Set();
      $scope.newSnippet = { category: "", language: "" };
      $scope.editMode = false;
      $scope.searchQuery = "";
      $scope.searchLanguage = "";
      $scope.searchCategory = "";
      $scope.collectionSearchQuery = "";
      $scope.collectionSearchLanguage = "";
      $scope.collectionSearchCategory = "";
      $scope.isLoggedIn = false;
      $scope.showCollection = false;
      $scope.isAdmin = localStorage.getItem("role") === "admin";
      $scope.errorMessage = "";
      $scope.successMessage = "";
      $scope.errors = {
        title: "",
        code: "",
        language: "",
        tags: "",
        category: "",
      };
      $scope.copiedSnippets = {};
      $scope.isCopying = false;
      $scope.removedSnippets = {};
      $scope.deletedSnippets = {};

      if (localStorage.getItem("token")) {
        $scope.isLoggedIn = true;
        logToFile("User authenticated, loading data", "INFO");
        loadSnippets();
        loadCollectionSnippetIds();
      } else {
        logToFile(
          "No authentication token found, redirecting to login",
          "WARN"
        );
        $location.path("/login");
      }

      function getConfig() {
        const token = localStorage.getItem("token");
        logToFile("Preparing API request configuration", "DEBUG");
        return { headers: { Authorization: token } };
      }

      function highlightCode() {
        if (typeof Prism !== "undefined") {
          $timeout(() => {
            Prism.highlightAll();
            logToFile("Code syntax highlighting applied", "DEBUG");
          });
        } else {
          logToFile(
            "Prism.js not loaded - syntax highlighting unavailable",
            "ERROR"
          );
        }
      }

      function loadCollectionSnippetIds() {
        logToFile("Loading user collection IDs", "INFO");
        $http
          .get("http://localhost:3000/collection", getConfig())
          .then((response) => {
            $scope.collectionSnippets = response.data;
            $scope.collectionSnippetIds = new Set(
              $scope.collectionSnippets.map((snippet) => snippet._id)
            );
            logToFile(
              `Loaded ${response.data.length} collection snippets`,
              "SUCCESS"
            );
          })
          .catch((err) => {
            logToFile(
              `Failed to load collection: ${err.status} - ${err.data?.message}`,
              "ERROR"
            );
            if (err.status === 401 || err.status === 403) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            }
          });
      }

      function loadSnippets() {
        logToFile("Loading all snippets", "INFO");
        $http
          .get("http://localhost:3000/snippets", getConfig())
          .then((response) => {
            $scope.snippets = response.data;
            $scope.filteredSnippets = $scope.snippets;
            $scope.searchSnippets();
            highlightCode();
            logToFile(
              `Loaded ${response.data.length} snippets successfully`,
              "SUCCESS"
            );
          })
          .catch((err) => {
            logToFile(
              `Failed to load snippets: ${err.status} - ${err.data?.message}`,
              "ERROR"
            );
            if (err.status === 401 || err.status === 403) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            }
          });
      }

      $scope.onEnter = function (event, nextFieldId, submitFunction) {
        if (event.key === "Enter") {
          event.preventDefault();
          if (nextFieldId) {
            const nextField = document.getElementById(nextFieldId);
            if (nextField) nextField.focus();
          } else if (submitFunction) {
            submitFunction();
          }
        }
      };

      $scope.clearErrors = function () {
        $scope.errorMessage = "";
        $scope.errors = {
          title: "",
          code: "",
          language: "",
          tags: "",
          category: "",
        };
        logToFile("Form errors cleared", "DEBUG");
      };

      $scope.saveSnippet = function () {
        logToFile("Attempting to save new snippet", "INFO");
        $scope.clearErrors();
        let hasError = false;

        // Validate title
        if (
          !$scope.newSnippet.title ||
          $scope.newSnippet.title.trim().length === 0
        ) {
          $scope.errors.title = "Please enter a title for the snippet.";
          hasError = true;
        }
        // Validate tags
        if (
          !$scope.newSnippet.tags ||
          $scope.newSnippet.tags.trim().length === 0
        ) {
          $scope.errors.tags = "Please enter at least one tag for the snippet.";
          hasError = true;
        }
        // Validate language
        if (!$scope.newSnippet.language) {
          $scope.errors.language = "Please select a valid language.";
          hasError = true;
        }
        // Validate code
        if (
          !$scope.newSnippet.code ||
          $scope.newSnippet.code.trim().length === 0
        ) {
          $scope.errors.code = "Code snippet cannot be empty.";
          hasError = true;
        } else if ($scope.newSnippet.code.trim().length < 10) {
          $scope.errors.code =
            "Code snippet is too short! Please provide a meaningful snippet.";
          hasError = true;
        }
        // Validate category
        if (!$scope.newSnippet.category) {
          $scope.errors.category = "Please select a category.";
          hasError = true;
        }

        if (hasError) {
          $scope.errorMessage =
            "Please fix the errors above before submitting.";
          logToFile("Snippet validation failed", "WARN");
          return;
        }

        $scope.newSnippet.tags = $scope.newSnippet.tags
          ? $scope.newSnippet.tags
              .split(",")
              .map((tag) => tag.trim().toLowerCase())
          : [];

        logToFile(`Saving snippet: ${$scope.newSnippet.title}`, "INFO");

        $http
          .post(
            "http://localhost:3000/snippets",
            $scope.newSnippet,
            getConfig()
          )
          .then((response) => {
            $scope.snippets.push(response.data);
            $scope.filteredSnippets = $scope.snippets;
            $scope.searchSnippets();
            $scope.clearForm();
            highlightCode();
            $scope.successMessage = "Snippet added successfully!";
            logToFile(
              `Snippet saved successfully: ${response.data._id}`,
              "SUCCESS"
            );
            $timeout(() => {
              $scope.successMessage = "";
            }, 1000);
          })
          .catch((err) => {
            logToFile(
              `Failed to save snippet: ${err.status} - ${err.data?.message}`,
              "ERROR"
            );
            if (err.status === 401 || err.status === 403) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            } else {
              $scope.errorMessage =
                "Error saving snippet: " +
                (err.data.message || "Unknown error");
            }
          });
      };

      $scope.editSnippet = function (snippet) {
        logToFile(`Editing snippet: ${snippet._id}`, "INFO");
        if (snippet.verified && !$scope.isAdmin) {
          $scope.errorMessage = "You cannot edit a verified snippet.";
          logToFile("Edit attempt blocked - verified snippet", "WARN");
          $timeout(() => {
            $scope.errorMessage = "";
          }, 2000);
          return;
        }

        $scope.newSnippet = angular.copy(snippet);
        $scope.newSnippet.tags = snippet.tags ? snippet.tags.join(", ") : "";
        $scope.editMode = true;
        $scope.clearErrors();
        $timeout(function () {
          const editSection = document.getElementById("edit-snippet-section");
          if (editSection) {
            editSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      };

      $scope.updateSnippet = function () {
        logToFile(`Updating snippet: ${$scope.newSnippet._id}`, "INFO");
        $scope.clearErrors();
        let hasError = false;

        // Same validation as saveSnippet
        if (
          !$scope.newSnippet.title ||
          $scope.newSnippet.title.trim().length === 0
        ) {
          $scope.errors.title = "Please enter a title for the snippet.";
          hasError = true;
        }
        if (
          !$scope.newSnippet.tags ||
          $scope.newSnippet.tags.trim().length === 0
        ) {
          $scope.errors.tags = "Please enter at least one tag for the snippet.";
          hasError = true;
        }
        if (!$scope.newSnippet.language) {
          $scope.errors.language = "Please select a valid language.";
          hasError = true;
        }
        if (
          !$scope.newSnippet.code ||
          $scope.newSnippet.code.trim().length === 0
        ) {
          $scope.errors.code = "Code snippet cannot be empty.";
          hasError = true;
        } else if ($scope.newSnippet.code.trim().length < 10) {
          $scope.errors.code =
            "Code snippet is too short! Please provide a meaningful snippet.";
          hasError = true;
        }
        if (!$scope.newSnippet.category) {
          $scope.errors.category = "Please select a category.";
          hasError = true;
        }

        if (hasError) {
          $scope.errorMessage =
            "Please fix the errors above before submitting.";
          logToFile("Snippet update validation failed", "WARN");
          return;
        }

        $scope.newSnippet.tags = $scope.newSnippet.tags
          ? $scope.newSnippet.tags
              .split(",")
              .map((tag) => tag.trim().toLowerCase())
          : [];

        $http
          .put(
            `http://localhost:3000/snippets/${$scope.newSnippet._id}`,
            $scope.newSnippet,
            getConfig()
          )
          .then((response) => {
            const snippetId = response.data._id;
            const index = $scope.snippets.findIndex((s) => s._id === snippetId);
            if (index !== -1) {
              $scope.snippets[index] = response.data;
            }
            const collectionIndex = $scope.collectionSnippets.findIndex(
              (s) => s._id === snippetId
            );
            if (collectionIndex !== -1) {
              $scope.collectionSnippets[collectionIndex] = response.data;
            }
            $scope.filteredSnippets = $scope.snippets;
            $scope.searchSnippets();
            $scope.filteredCollectionSnippets = $scope.collectionSnippets;
            $scope.searchCollectionSnippets();
            $scope.clearForm();
            highlightCode();
            $scope.successMessage = "Snippet updated successfully!";
            logToFile(`Snippet updated successfully: ${snippetId}`, "SUCCESS");
            $timeout(() => {
              $scope.successMessage = "";
            }, 1000);
          })
          .catch((err) => {
            logToFile(
              `Failed to update snippet: ${err.status} - ${err.data?.message}`,
              "ERROR"
            );
            if (err.status === 401) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            } else {
              $scope.errorMessage =
                "Error updating snippet: " +
                (err.data.message || "Unknown error");
            }
          });
      };

      $scope.deleteSnippet = function (snippetId) {
        logToFile(`Deleting snippet: ${snippetId}`, "INFO");
        $scope.deletedSnippets[snippetId] = true;
        if (!$scope.$$phase) {
          $scope.$apply();
        }
        $http
          .delete(`http://localhost:3000/snippets/${snippetId}`, getConfig())
          .then(() => {
            $timeout(() => {
              $scope.snippets = $scope.snippets.filter(
                (s) => s._id !== snippetId
              );
              $scope.filteredSnippets = $scope.snippets;
              $scope.collectionSnippets = $scope.collectionSnippets.filter(
                (s) => s._id !== snippetId
              );
              $scope.filteredCollectionSnippets = $scope.collectionSnippets;
              $scope.collectionSnippetIds.delete(snippetId);
              $scope.searchSnippets();
              $scope.searchCollectionSnippets();
              highlightCode();
              $scope.deletedSnippets[snippetId] = false;
              logToFile(
                `Snippet deleted successfully: ${snippetId}`,
                "SUCCESS"
              );
              if (!$scope.$$phase) {
                $scope.$apply();
              }
            }, 300);
          })
          .catch((err) => {
            logToFile(
              `Failed to delete snippet: ${err.status} - ${err.data?.message}`,
              "ERROR"
            );
            $scope.deletedSnippets[snippetId] = false;
            if (err.status === 401 || err.status === 403) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            }
            if (!$scope.$$phase) {
              $scope.$apply();
            }
          });
      };

      $scope.copySnippet = function (snippet, $event) {
        if ($event) {
          $event.preventDefault();
        }

        if ($scope.isCopying) {
          return;
        }
        $scope.isCopying = true;

        if (!$scope.copiedSnippets) {
          $scope.copiedSnippets = {};
        }

        if (!snippet || !snippet._id) {
          $scope.errorMessage = "Error copying code: Invalid snippet ID";
          $scope.isCopying = false;
          logToFile("Copy failed - invalid snippet", "ERROR");
          return;
        }

        const copyText = snippet.code;
        logToFile(`Copying snippet to clipboard: ${snippet._id}`, "INFO");

        if (navigator.clipboard) {
          navigator.clipboard
            .writeText(copyText)
            .then(() => {
              $scope.copiedSnippets[snippet._id] = true;
              logToFile(
                `Snippet copied successfully: ${snippet._id}`,
                "SUCCESS"
              );
              if (!$scope.$$phase) {
                $scope.$apply();
              }
              $timeout(() => {
                $scope.copiedSnippets[snippet._id] = false;
                $scope.isCopying = false;
                if (!$scope.$$phase) {
                  $scope.$apply();
                }
              }, 300);
            })
            .catch((err) => {
              logToFile(`Clipboard copy failed: ${err.message}`, "ERROR");
              $scope.errorMessage =
                "Error copying code: " + (err.message || "Unknown error");
              $scope.isCopying = false;
              if (!$scope.$$phase) {
                $scope.$apply();
              }
            });
        } else {
          // Fallback for older browsers
          const textarea = document.createElement("textarea");
          textarea.value = copyText;
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand("copy");
            $scope.copiedSnippets[snippet._id] = true;
            logToFile(
              `Snippet copied successfully (fallback): ${snippet._id}`,
              "SUCCESS"
            );
            if (!$scope.$$phase) {
              $scope.$apply();
            }
            $timeout(() => {
              $scope.copiedSnippets[snippet._id] = false;
              $scope.isCopying = false;
              if (!$scope.$$phase) {
                $scope.$apply();
              }
            }, 1000);
          } catch (err) {
            logToFile(`Copy fallback failed: ${err.message}`, "ERROR");
            $scope.errorMessage =
              "Error copying code: " + (err.message || "Unknown error");
            $scope.isCopying = false;
            if (!$scope.$$phase) {
              $scope.$apply();
            }
          } finally {
            document.body.removeChild(textarea);
          }
        }
      };

      $scope.addToCollection = function (snippetId) {
        logToFile(`Adding snippet to collection: ${snippetId}`, "INFO");
        $http
          .post("http://localhost:3000/collection", { snippetId }, getConfig())
          .then(() => {
            $scope.collectionSnippetIds.add(snippetId);
            $scope.successMessage = "Snippet added to collection!";
            logToFile(
              `Snippet added to collection successfully: ${snippetId}`,
              "SUCCESS"
            );
            $timeout(() => {
              $scope.successMessage = "";
            }, 1000);
          })
          .catch((err) => {
            logToFile(
              `Failed to add to collection: ${err.status} - ${err.data?.message}`,
              "ERROR"
            );
            if (err.status === 401 || err.status === 403) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            } else {
              $scope.errorMessage =
                "Error adding to collection: " +
                (err.data.message || "Unknown error");
            }
          });
      };

      $scope.viewCollection = function () {
        logToFile("Loading user collection view", "INFO");
        $http
          .get("http://localhost:3000/collection", getConfig())
          .then((response) => {
            $scope.collectionSnippets = response.data;
            $scope.filteredCollectionSnippets = $scope.collectionSnippets;
            $scope.collectionSnippetIds = new Set(
              $scope.collectionSnippets.map((snippet) => snippet._id)
            );
            $scope.collectionSearchQuery = "";
            $scope.collectionSearchLanguage = "";
            $scope.collectionSearchCategory = "";
            $scope.showCollection = true;
            highlightCode();
            logToFile(
              `Collection view loaded with ${response.data.length} snippets`,
              "SUCCESS"
            );
          })
          .catch((err) => {
            logToFile(
              `Failed to load collection view: ${err.status} - ${err.data?.message}`,
              "ERROR"
            );
            if (err.status === 401 || err.status === 403) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            }
          });
      };

      $scope.removeFromCollection = function (snippetId) {
        logToFile(`Removing snippet from collection: ${snippetId}`, "INFO");
        $scope.removedSnippets[snippetId] = true;
        if (!$scope.$$phase) {
          $scope.$apply();
        }
        $http
          .delete(`http://localhost:3000/collection/${snippetId}`, getConfig())
          .then(() => {
            $timeout(() => {
              $scope.collectionSnippets = $scope.collectionSnippets.filter(
                (s) => s._id !== snippetId
              );
              $scope.filteredCollectionSnippets = $scope.collectionSnippets;
              $scope.collectionSnippetIds.delete(snippetId);
              $scope.searchCollectionSnippets();
              highlightCode();
              $scope.removedSnippets[snippetId] = false;
              $scope.successMessage = "Snippet removed from collection!";
              logToFile(
                `Snippet removed from collection successfully: ${snippetId}`,
                "SUCCESS"
              );
              $timeout(() => {
                $scope.successMessage = "";
              }, 1000);
              if (!$scope.$$phase) {
                $scope.$apply();
              }
            }, 300);
          })
          .catch((err) => {
            logToFile(
              `Failed to remove from collection: ${err.status} - ${err.data?.message}`,
              "ERROR"
            );
            $scope.removedSnippets[snippetId] = false;
            if (err.status === 401 || err.status === 403) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            } else {
              $scope.errorMessage =
                "Error removing from collection: " +
                (err.data.message || "Unknown error");
            }
            if (!$scope.$$phase) {
              $scope.$apply();
            }
          });
      };

      $scope.searchSnippets = function () {
        const params = new URLSearchParams();
        params.append("q", $scope.searchQuery || "");
        params.append("language", $scope.searchLanguage || "");
        params.append("category", $scope.searchCategory || "");

        logToFile(
          `Searching snippets with query: ${$scope.searchQuery}`,
          "DEBUG"
        );

        $http
          .get(
            `http://localhost:3000/snippets/search?${params.toString()}`,
            getConfig()
          )
          .then((response) => {
            $scope.filteredSnippets = response.data;
            highlightCode();
            logToFile(
              `Search returned ${response.data.length} results`,
              "SUCCESS"
            );
          })
          .catch((err) => {
            logToFile(
              `Search failed: ${err.status} - ${err.data?.message}`,
              "ERROR"
            );
            if (err.status === 401 || err.status === 403) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            }
          });
      };

      $scope.searchCollectionSnippets = function () {
        logToFile("Searching collection snippets", "DEBUG");
        let filtered = $scope.collectionSnippets;

        if ($scope.collectionSearchLanguage) {
          filtered = filtered.filter(
            (snippet) =>
              snippet.language.toLowerCase() ===
              $scope.collectionSearchLanguage.toLowerCase()
          );
        }

        if ($scope.collectionSearchCategory) {
          filtered = filtered.filter(
            (snippet) =>
              snippet.category.toLowerCase() ===
              $scope.collectionSearchCategory.toLowerCase()
          );
        }

        if ($scope.collectionSearchQuery) {
          const query = $scope.collectionSearchQuery.toLowerCase();
          filtered = filtered.filter(
            (snippet) =>
              snippet.title.toLowerCase().includes(query) ||
              snippet.code.toLowerCase().includes(query) ||
              (snippet.tags &&
                snippet.tags.some((tag) => tag.toLowerCase().includes(query)))
          );
        }

        $scope.filteredCollectionSnippets = filtered;
        highlightCode();
        logToFile(
          `Collection search returned ${filtered.length} results`,
          "SUCCESS"
        );
      };

      $scope.verifySnippet = function (snippetId) {
        logToFile(`Verifying snippet: ${snippetId}`, "INFO");
        // Save the current scroll position
        const scrollPosition = window.scrollY;

        $http
          .put(
            `http://localhost:3000/snippets/${snippetId}/verify`,
            {},
            getConfig()
          )
          .then((response) => {
            // Update the snippet in $scope.snippets
            const index = $scope.snippets.findIndex((s) => s._id === snippetId);
            if (index !== -1) {
              $scope.snippets[index].verified = response.data.verified;
            }

            // Update the snippet in $scope.collectionSnippets
            const collectionIndex = $scope.collectionSnippets.findIndex(
              (s) => s._id === snippetId
            );
            if (collectionIndex !== -1) {
              $scope.collectionSnippets[collectionIndex].verified =
                response.data.verified;
            }

            // Update filtered lists in place to avoid re-rendering
            const filteredIndex = $scope.filteredSnippets.findIndex(
              (s) => s._id === snippetId
            );
            if (filteredIndex !== -1) {
              $scope.filteredSnippets[filteredIndex].verified =
                response.data.verified;
            }

            const filteredCollectionIndex =
              $scope.filteredCollectionSnippets.findIndex(
                (s) => s._id === snippetId
              );
            if (filteredCollectionIndex !== -1) {
              $scope.filteredCollectionSnippets[
                filteredCollectionIndex
              ].verified = response.data.verified;
            }

            highlightCode();
            logToFile(`Snippet verified successfully: ${snippetId}`, "SUCCESS");

            // Restore the original scroll position after the DOM updates
            $timeout(() => {
              window.scrollTo(0, scrollPosition);
            }, 0);
          })
          .catch((err) => {
            logToFile(
              `Failed to verify snippet: ${err.status} - ${err.data?.message}`,
              "ERROR"
            );
            if (err.status === 401 || err.status === 403) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            }
            // Restore scroll position in case of error
            $timeout(() => {
              window.scrollTo(0, scrollPosition);
            }, 0);
          });
      };

      $scope.reportInvalid = function (snippetId) {
        logToFile(`Reporting snippet as invalid: ${snippetId}`, "INFO");
        // Save the current scroll position
        const scrollPosition = window.scrollY;

        $http
          .put(
            `http://localhost:3000/snippets/${snippetId}/report-invalid`,
            {},
            getConfig()
          )
          .then((response) => {
            // Update the snippet in $scope.snippets
            const index = $scope.snippets.findIndex((s) => s._id === snippetId);
            if (index !== -1) {
              $scope.snippets[index].verified = response.data.verified;
            }

            // Update the snippet in $scope.collectionSnippets
            const collectionIndex = $scope.collectionSnippets.findIndex(
              (s) => s._id === snippetId
            );
            if (collectionIndex !== -1) {
              $scope.collectionSnippets[collectionIndex].verified =
                response.data.verified;
            }

            // Update filtered lists in place to avoid re-rendering
            const filteredIndex = $scope.filteredSnippets.findIndex(
              (s) => s._id === snippetId
            );
            if (filteredIndex !== -1) {
              $scope.filteredSnippets[filteredIndex].verified =
                response.data.verified;
            }

            const filteredCollectionIndex =
              $scope.filteredCollectionSnippets.findIndex(
                (s) => s._id === snippetId
              );
            if (filteredCollectionIndex !== -1) {
              $scope.filteredCollectionSnippets[
                filteredCollectionIndex
              ].verified = response.data.verified;
            }

            highlightCode();
            logToFile(
              `Snippet reported as invalid successfully: ${snippetId}`,
              "SUCCESS"
            );

            // Restore the original scroll position after the DOM updates
            $timeout(() => {
              window.scrollTo(0, scrollPosition);
            }, 0);
          })
          .catch((err) => {
            logToFile(
              `Failed to report snippet as invalid: ${err.status} - ${err.data?.message}`,
              "ERROR"
            );
            if (err.status === 401 || err.status === 403) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            }
            // Restore scroll position in case of error
            $timeout(() => {
              window.scrollTo(0, scrollPosition);
            }, 0);
          });
      };

      $scope.clearForm = function () {
        $scope.newSnippet = { category: "", language: "" };
        $scope.editMode = false;
        $scope.clearErrors();
        logToFile("Form cleared", "DEBUG");
      };

      $scope.logout = function () {
        logToFile("User logging out", "INFO");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        $scope.isLoggedIn = false;
        $location.path("/login");
      };

      // Expose logging functions for debugging in browser console
      window.exportSnippetLogs = exportLogs;
      window.clearSnippetLogs = clearLogs;
      window.viewSnippetLogs = function () {
        const logs = JSON.parse(
          localStorage.getItem("snippetManagerLogs") || "[]"
        );
        console.table(logs);
        return logs;
      };

      logToFile("SnippetController initialization complete", "SUCCESS");
    }
  );
