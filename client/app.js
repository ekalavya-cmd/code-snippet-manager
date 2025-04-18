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
  })
  .controller("AuthController", function ($scope, $http, $location) {
    // Initialize loginData and registerData with empty strings to ensure binding works
    $scope.loginData = { email: "", password: "" };
    $scope.registerData = { email: "", username: "", password: "" };
    $scope.errorMessage = "";
    $scope.errors = { email: "", password: "", username: "" };

    $scope.clearErrors = function () {
      $scope.errorMessage = "";
      $scope.errors = { email: "", password: "", username: "" };
    };

    $scope.register = function () {
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
        return;
      }

      console.log("Sending register request:", $scope.registerData);

      $http
        .post("http://localhost:3000/register", $scope.registerData)
        .then((response) => {
          console.log("Registration successful:", response.data);
          $location.path("/login");
        })
        .catch((err) => {
          console.error("Registration error:", err);
          $scope.errorMessage =
            "Registration failed: " + (err.data.message || "Unknown error");
        });
    };

    $scope.login = function () {
      $scope.clearErrors();
      let hasError = false;

      console.log("loginData before validation:", $scope.loginData);
      if (!$scope.loginData.email) {
        $scope.errors.email = "Please enter your email or username.";
        hasError = true;
      }
      if (!$scope.loginData.password) {
        $scope.errors.password = "Please enter your password.";
        hasError = true;
      }

      if (hasError) {
        return;
      }

      const loginPayload = {
        emailOrUsername: $scope.loginData.email.trim(), // Trim to remove any accidental spaces
        password: $scope.loginData.password.trim(),
      };

      console.log("Sending login request:", loginPayload);

      $http
        .post("http://localhost:3000/login", loginPayload)
        .then((response) => {
          console.log("Login successful:", response.data);
          localStorage.setItem("token", response.data.token);
          const token = response.data.token;
          const payload = JSON.parse(atob(token.split(".")[1]));
          localStorage.setItem("role", payload.role);
          $location.path("/app");
        })
        .catch((err) => {
          console.error("Login error:", err);
          $scope.errorMessage =
            "Login failed: " + (err.data.message || "Unknown error");
        });
    };

    $scope.goToLogin = function () {
      console.log("Navigating to login page");
      $location.path("/login");
    };

    $scope.goToRegister = function () {
      console.log("Navigating to register page");
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
      $scope.snippets = [];
      $scope.filteredSnippets = [];
      $scope.collectionSnippets = [];
      $scope.filteredCollectionSnippets = [];
      $scope.collectionSnippetIds = new Set();
      $scope.newSnippet = { category: "", language: "" }; // Updated default values
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
      }; // Added category error
      $scope.copiedSnippets = {};
      $scope.isCopying = false;
      $scope.removedSnippets = {};
      $scope.deletedSnippets = {};

      if (localStorage.getItem("token")) {
        $scope.isLoggedIn = true;
        loadSnippets();
        loadCollectionSnippetIds();
      } else {
        $location.path("/login");
      }

      function getConfig() {
        const token = localStorage.getItem("token");
        console.log("Token being sent:", token);
        return { headers: { Authorization: token } };
      }

      function highlightCode() {
        if (typeof Prism !== "undefined") {
          $timeout(() => {
            Prism.highlightAll();
            console.log("Prism.js: Highlighted code blocks");
          });
        } else {
          console.error("Prism.js is not loaded");
        }
      }

      function loadCollectionSnippetIds() {
        $http
          .get("http://localhost:3000/collection", getConfig())
          .then((response) => {
            $scope.collectionSnippets = response.data;
            $scope.collectionSnippetIds = new Set(
              $scope.collectionSnippets.map((snippet) => snippet._id)
            );
          })
          .catch((err) => {
            console.error("Error loading collection IDs:", err);
            if (err.status === 401 || err.status === 403) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            }
          });
      }

      function loadSnippets() {
        $http
          .get("http://localhost:3000/snippets", getConfig())
          .then((response) => {
            $scope.snippets = response.data;
            $scope.filteredSnippets = $scope.snippets;
            $scope.searchSnippets();
            highlightCode();
          })
          .catch((err) => {
            console.error("Error loading snippets:", err);
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
        }; // Added category error
      };

      $scope.saveSnippet = function () {
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
          // Updated to check for empty string
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
          // Added validation for category
          $scope.errors.category = "Please select a category.";
          hasError = true;
        }

        if (hasError) {
          $scope.errorMessage =
            "Please fix the errors above before submitting.";
          return;
        }

        $scope.newSnippet.tags = $scope.newSnippet.tags
          ? $scope.newSnippet.tags
              .split(",")
              .map((tag) => tag.trim().toLowerCase())
          : [];
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
            $timeout(() => {
              $scope.successMessage = "";
            }, 1000);
          })
          .catch((err) => {
            console.error("Error saving snippet:", err);
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
        if (snippet.verified && !$scope.isAdmin) {
          $scope.errorMessage = "You cannot edit a verified snippet.";
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
          // Updated to check for empty string
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
          // Added validation for category
          $scope.errors.category = "Please select a category.";
          hasError = true;
        }

        if (hasError) {
          $scope.errorMessage =
            "Please fix the errors above before submitting.";
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
            $timeout(() => {
              $scope.successMessage = "";
            }, 1000);
          })
          .catch((err) => {
            console.error("Error updating snippet:", err);
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
              if (!$scope.$$phase) {
                $scope.$apply();
              }
            }, 300);
          })
          .catch((err) => {
            console.error("Error deleting snippet:", err);
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
          return;
        }

        const copyText = snippet.code;

        if (navigator.clipboard) {
          navigator.clipboard
            .writeText(copyText)
            .then(() => {
              $scope.copiedSnippets[snippet._id] = true;
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
              console.error("Error copying code with Clipboard API:", err);
              $scope.errorMessage =
                "Error copying code: " + (err.message || "Unknown error");
              $scope.isCopying = false;
              if (!$scope.$$phase) {
                $scope.$apply();
              }
            });
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = copyText;
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand("copy");
            $scope.copiedSnippets[snippet._id] = true;
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
            console.error("Error copying code with execCommand:", err);
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
        $http
          .post("http://localhost:3000/collection", { snippetId }, getConfig())
          .then(() => {
            $scope.collectionSnippetIds.add(snippetId);
            $scope.successMessage = "Snippet added to collection!";
            $timeout(() => {
              $scope.successMessage = "";
            }, 1000);
          })
          .catch((err) => {
            console.error("Error adding to collection:", err);
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
          })
          .catch((err) => {
            console.error("Error loading collection:", err);
            if (err.status === 401 || err.status === 403) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            }
          });
      };

      $scope.removeFromCollection = function (snippetId) {
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
              $timeout(() => {
                $scope.successMessage = "";
              }, 1000);
              if (!$scope.$$phase) {
                $scope.$apply();
              }
            }, 300);
          })
          .catch((err) => {
            console.error("Error removing from collection:", err);
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

        $http
          .get(
            `http://localhost:3000/snippets/search?${params.toString()}`,
            getConfig()
          )
          .then((response) => {
            $scope.filteredSnippets = response.data;
            highlightCode();
          })
          .catch((err) => {
            console.error("Error searching snippets:", err);
            if (err.status === 401 || err.status === 403) {
              localStorage.removeItem("token");
              $scope.isLoggedIn = false;
              $location.path("/login");
            }
          });
      };

      $scope.searchCollectionSnippets = function () {
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
      };

      $scope.verifySnippet = function (snippetId) {
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
              $scope.snippets[index].verified = response.data.verified; // Update only the verified field
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

            // Restore the original scroll position after the DOM updates
            $timeout(() => {
              window.scrollTo(0, scrollPosition);
            }, 0);
          })
          .catch((err) => {
            console.error("Error verifying snippet:", err);
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
              $scope.snippets[index].verified = response.data.verified; // Update only the verified field
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

            // Restore the original scroll position after the DOM updates
            $timeout(() => {
              window.scrollTo(0, scrollPosition);
            }, 0);
          })
          .catch((err) => {
            console.error("Error reporting snippet as invalid:", err);
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
        $scope.newSnippet = { category: "", language: "" }; // Updated default values
        $scope.editMode = false;
        $scope.clearErrors();
      };

      $scope.logout = function () {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        $scope.isLoggedIn = false;
        $location.path("/login");
      };
    }
  );
